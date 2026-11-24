import type {
  Campaign,
  CampaignRecipient,
  CampaignStore,
  RecipientCounts,
  RecipientStore,
} from './campaignTypes';
import type {
  Enrollment,
  EnrollmentCounts,
  EnrollmentStore,
  Sequence,
  SequenceStore,
} from './sequenceTypes';
import type { Suppression, SuppressionStore } from './suppression';

const createMemoryCampaignStore = (): CampaignStore => {
  const campaignRows = new Map<string, Campaign>();
  return {
    get: async (id) => {
      return campaignRows.get(id) ?? null;
    },
    save: async (campaign) => {
      campaignRows.set(campaign.id, { ...campaign });
    },
    listDue: async ({ now }) => {
      return [...campaignRows.values()].filter((c) => {
        return (
          c.status === 'sending' ||
          (c.status === 'scheduled' && (c.scheduledAt ?? now) <= now)
        );
      });
    },
  };
};

const emptyCounts = (): RecipientCounts => {
  return { pending: 0, sending: 0, sent: 0, skipped: 0, failed: 0 };
};

const createMemoryRecipientStore = (): RecipientStore => {
  const recipientRows = new Map<string, CampaignRecipient>();
  const key = (campaignId: string, email: string) => {
    return `${campaignId}\u0000${email}`;
  };
  const ofCampaign = (campaignId: string) => {
    return [...recipientRows.values()].filter((row) => {
      return row.campaignId === campaignId;
    });
  };
  return {
    add: async ({ campaignId, recipients: list }) => {
      let added = 0;
      for (const { email, variables } of list) {
        if (!recipientRows.has(key(campaignId, email))) {
          recipientRows.set(key(campaignId, email), {
            campaignId,
            email,
            variables,
            status: 'pending',
            reason: null,
            messageId: null,
            claimedAt: null,
          });
          added += 1;
        }
      }
      return added;
    },
    claim: async ({ campaignId, limit, now }) => {
      const claimed = ofCampaign(campaignId)
        .filter((row) => {
          return row.status === 'pending';
        })
        .slice(0, limit);
      for (const row of claimed) {
        Object.assign(row, { status: 'sending', claimedAt: now });
      }
      return claimed.map((row) => {
        return { ...row };
      });
    },
    release: async ({ campaignId, emails }) => {
      for (const email of emails) {
        const row = recipientRows.get(key(campaignId, email));
        if (row?.status === 'sending') {
          Object.assign(row, { status: 'pending', claimedAt: null });
        }
      }
    },
    complete: async ({ campaignId, email, status, reason, messageId }) => {
      const row = recipientRows.get(key(campaignId, email));
      if (row) {
        Object.assign(row, { status, reason, messageId });
      }
    },
    failStale: async ({ campaignId, claimedBefore }) => {
      const stale = ofCampaign(campaignId).filter((row) => {
        return (
          row.status === 'sending' &&
          row.claimedAt !== null &&
          row.claimedAt < claimedBefore
        );
      });
      for (const row of stale) {
        Object.assign(row, { status: 'failed', reason: 'interrupted' });
      }
      return stale.length;
    },
    count: async ({ campaignId }) => {
      const counts = emptyCounts();
      for (const row of ofCampaign(campaignId)) {
        counts[row.status] += 1;
      }
      return counts;
    },
  };
};

const createMemorySequenceStore = (): SequenceStore => {
  const sequenceRows = new Map<string, Sequence>();
  return {
    get: async (id) => {
      const row = sequenceRows.get(id);
      return row ? { ...row, steps: [...row.steps] } : null;
    },
    save: async (sequence) => {
      sequenceRows.set(sequence.id, {
        ...sequence,
        steps: [...sequence.steps],
      });
    },
    listActive: async () => {
      return [...sequenceRows.values()]
        .filter((row) => {
          return row.status === 'active';
        })
        .map((row) => {
          return row.id;
        });
    },
  };
};

const createMemoryEnrollmentStore = (): EnrollmentStore => {
  const enrollmentRows = new Map<string, Enrollment>();
  const key = ({
    sequenceId,
    email,
  }: {
    sequenceId: string;
    email: string;
  }) => {
    return `${sequenceId}\u0000${email}`;
  };
  const copy = (row: Enrollment) => {
    return { ...row };
  };
  return {
    get: async (args) => {
      const row = enrollmentRows.get(key(args));
      return row ? copy(row) : null;
    },
    add: async (enrollment) => {
      if (enrollmentRows.has(key(enrollment))) {
        return false;
      }
      enrollmentRows.set(key(enrollment), copy(enrollment));
      return true;
    },
    save: async (enrollment) => {
      enrollmentRows.set(key(enrollment), copy(enrollment));
    },
    claimDue: async ({ sequenceIds, now, limit }) => {
      const claimed = [...enrollmentRows.values()]
        .filter((row) => {
          return (
            row.status === 'active' &&
            sequenceIds.includes(row.sequenceId) &&
            row.nextAt !== null &&
            row.nextAt <= now
          );
        })
        .slice(0, limit);
      for (const row of claimed) {
        Object.assign(row, { status: 'sending', claimedAt: now });
      }
      return claimed.map(copy);
    },
    listStale: async ({ claimedBefore }) => {
      return [...enrollmentRows.values()]
        .filter((row) => {
          return (
            row.status === 'sending' &&
            row.claimedAt !== null &&
            row.claimedAt < claimedBefore
          );
        })
        .map(copy);
    },
    count: async ({ sequenceId }) => {
      const counts: EnrollmentCounts = {
        active: 0,
        sending: 0,
        completed: 0,
        exited: 0,
      };
      for (const row of enrollmentRows.values()) {
        if (row.sequenceId === sequenceId) {
          counts[row.status] += 1;
        }
      }
      return counts;
    },
  };
};

const createMemorySuppressionStore = (): SuppressionStore => {
  const suppressionRows: Suppression[] = [];
  return {
    find: async ({ email, scopes }) => {
      return suppressionRows.filter((row) => {
        return row.email === email && scopes.includes(row.scope);
      });
    },
    save: async (suppression) => {
      const index = suppressionRows.findIndex((row) => {
        return (
          row.email === suppression.email && row.scope === suppression.scope
        );
      });
      if (index >= 0) {
        suppressionRows[index] = suppression;
      } else {
        suppressionRows.push(suppression);
      }
    },
    removeManual: async ({ email, scope }) => {
      const index = suppressionRows.findIndex((row) => {
        return (
          row.email === email && row.scope === scope && row.reason === 'manual'
        );
      });
      if (index >= 0) {
        suppressionRows.splice(index, 1);
      }
    },
  };
};

/**
 * Every store the package needs, in memory: for tests, local development, and
 * as a reference for implementing them over your database. Data is lost when
 * the process ends.
 */
export const createMemoryStores = () => {
  return {
    campaigns: createMemoryCampaignStore(),
    recipients: createMemoryRecipientStore(),
    suppressions: createMemorySuppressionStore(),
    sequences: createMemorySequenceStore(),
    enrollments: createMemoryEnrollmentStore(),
  };
};
