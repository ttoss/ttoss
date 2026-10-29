/**
 * The `ProximityPanel` story's right sidebar: the services the proximity search
 * found, nearest first, in step with the pins on the map.
 */
import { useGeoVisProximitySearch } from '@ttoss/geovis';
import { useGeovisWorkspace } from '@ttoss/geovis-workspace';
import { Icon } from '@ttoss/react-icons';

import {
  BLUE,
  Counts,
  CSS,
  FAINT,
  FONT_HEAD,
  FONT_MONO,
  formatRadius,
  GREEN,
  HAIRLINE,
  INK,
  MUTED,
  Skeleton,
  useOpenWithSearch,
} from './ProximityPanel.parts';
import { PlaceRow } from './ProximityPanel.row';

/** The title and the line under it, for where the search stands. */
const headings = ({
  status,
  count,
  radius,
  pending,
}: {
  status: 'idle' | 'loading' | 'done';
  count: number;
  radius: string;
  pending: boolean;
}) => {
  if (status === 'idle') {
    return {
      title: 'Nenhuma busca',
      sub: 'Clique num hospital para buscar os serviços em volta.',
    };
  }
  if (pending) {
    return {
      title: 'Buscando serviços…',
      sub: `Consultando serviços no raio de ${radius}…`,
    };
  }
  const found = count
    ? `${count} ${count === 1 ? 'serviço' : 'serviços'}`
    : 'Nenhum serviço';
  return {
    title: `${found} em até ${radius}`,
    sub:
      status === 'loading'
        ? `Ampliando a busca para ${radius}…`
        : count
          ? 'Ordenados do mais próximo ao mais distante'
          : 'Tente um raio maior',
  };
};

/** Where the search started from, and the × that closes the sidebar. */
const Kicker = ({ fromUser }: { fromUser: boolean }) => {
  const { setRightSidebarOpen } = useGeovisWorkspace();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: FONT_HEAD,
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: fromUser ? BLUE : GREEN,
          paddingTop: 3,
        }}
      >
        <Icon
          icon={fromUser ? 'lucide:locate-fixed' : 'lucide:map-pin'}
          width={12}
        />
        {fromUser ? 'Perto de você' : 'Busca a partir do pin'}
      </span>
      <button
        type="button"
        className="pp-close"
        aria-label="Fechar painel"
        title="Fechar"
        onClick={(event) => {
          event.currentTarget.blur();
          setRightSidebarOpen({ open: false });
        }}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          margin: '-4px -6px 0 0',
          borderRadius: 8,
          border: 0,
          background: 'transparent',
          color: FAINT,
          cursor: 'pointer',
          transition: 'color 0.15s, background 0.15s',
        }}
      >
        <Icon icon="lucide:x" width={14} />
      </button>
    </div>
  );
};

/** Shown when the search found nothing within the radius. */
const EmptyResults = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '22px 20px',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: INK }}>
        Nenhum serviço encontrado neste raio.
      </div>
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.5,
          color: MUTED,
          textWrap: 'pretty',
        }}
      >
        Aumente o raio da busca no seletor abaixo do círculo para ver serviços
        mais distantes.
      </div>
    </div>
  );
};

/** Where the search is centred, and its radius. */
const Footer = ({
  fromUser,
  radius,
}: {
  fromUser: boolean;
  radius: string;
}) => {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '10px 20px',
        background: '#f8fafc',
        borderTop: HAIRLINE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        fontFamily: FONT_MONO,
        fontSize: 9.5,
      }}
    >
      <span
        style={{
          color: MUTED,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {fromUser ? 'Centro: sua localização' : 'Centro: pin no mapa'}
      </span>
      <span style={{ color: FAINT, flexShrink: 0 }}>Raio {radius}</span>
    </div>
  );
};

/**
 * The app's sidebar: the services the proximity search found, nearest first,
 * in step with the pins on the map.
 */
export const ServicesNearbyPanel = () => {
  useOpenWithSearch();
  const search = useGeoVisProximitySearch();
  if (!search) return null;

  const { status, results, radius, fromUser, selectedId } = search;
  // The first answer is still on its way: nothing to count or list yet.
  const pending = status === 'loading' && results.length === 0;
  const radiusLabel = formatRadius(radius);
  const { title, sub } = headings({
    status,
    count: results.length,
    radius: radiusLabel,
    pending,
  });

  return (
    <aside
      aria-label="Serviços na região"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#ffffff',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>{CSS}</style>
      <div
        style={{
          flexShrink: 0,
          padding: '16px 20px 0',
          borderBottom: HAIRLINE,
        }}
      >
        <Kicker fromUser={fromUser} />
        <h2
          style={{
            fontFamily: FONT_HEAD,
            fontWeight: 600,
            fontSize: 19,
            lineHeight: 1.15,
            letterSpacing: '0.01em',
            color: INK,
            margin: '8px 0 0',
            textWrap: 'pretty',
          }}
        >
          {title}
        </h2>
        <div
          style={{
            marginTop: 4,
            paddingBottom: 14,
            fontSize: 11.5,
            color: MUTED,
          }}
        >
          {sub}
        </div>
        {status !== 'idle' && <Counts results={results} pending={pending} />}
      </div>

      <div
        className="pp-scroll"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
      >
        {pending && <Skeleton />}
        {status === 'done' && results.length === 0 && <EmptyResults />}
        {results.map((hit) => {
          return (
            <PlaceRow
              key={hit.id}
              hit={hit}
              expanded={selectedId === hit.id}
              onToggle={() => {
                search.select(hit.id);
              }}
            />
          );
        })}
      </div>

      {status !== 'idle' && <Footer fromUser={fromUser} radius={radiusLabel} />}
    </aside>
  );
};
