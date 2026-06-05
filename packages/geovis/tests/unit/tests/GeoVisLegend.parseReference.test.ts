import { Link } from '@ttoss/ui';
import * as React from 'react';
import { parseReference } from 'src/ui/GeoVisLegend';
/**
 * Extracted from GeoVisLegend.tsx for isolated unit testing.
 * Parses a reference string and returns an array of React nodes.
 * Inline link syntax: `{link:visible text|https://example.com}` is
 * rendered as a @ttoss/ui Link component. URLs with non-http(s) schemes
 * are rendered as plain text to prevent unsafe navigation.
 */

/**
 * Helper to extract text content from a mixed array of strings and React elements.
 */
const extractTextContent = (nodes: React.ReactNode[]): string => {
  return nodes
    .map((node) => {
      if (typeof node === 'string') return node;
      if (
        React.isValidElement(node) &&
        typeof node.props.children === 'string'
      ) {
        return node.props.children;
      }
      return '';
    })
    .join('');
};

/**
 * Helper to find link elements in an array of React nodes.
 */
const findLinkElements = (
  nodes: React.ReactNode[]
): React.ReactElement<{ href: string }>[] => {
  return nodes.filter((node) => {
    return React.isValidElement(node) && node.type === Link;
  }) as React.ReactElement<{ href: string }>[];
};

describe('parseReference', () => {
  describe('happy path: plain text without links', () => {
    test('returns plain text as a single node when no links present', () => {
      const text = 'Dados agregados por distrito municipal de São Paulo.';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(text);
    });

    test('returns plain text with special characters unchanged', () => {
      const text = 'Source: Census Bureau (2020) — official data.';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(text);
    });

    test('returns empty array when text is empty', () => {
      const result = parseReference('');

      expect(result).toHaveLength(0);
    });
  });

  describe('happy path: single link', () => {
    test('parses single HTTPS link in the middle of text', () => {
      const text =
        'Data from {link:SEADE|https://repositorio.seade.gov.br} for 2025.';
      const result = parseReference(text);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Data from ');
      expect(result[2]).toBe(' for 2025.');

      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.href).toBe('https://repositorio.seade.gov.br');
      expect(links[0].props.target).toBe('_blank');
      expect(links[0].props.children).toBe('SEADE');
    });

    test('parses single HTTP link (not HTTPS)', () => {
      const text = 'Check {link:this source|http://example.com} here.';
      const result = parseReference(text);

      expect(result).toHaveLength(3);
      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.href).toBe('http://example.com');
      expect(links[0].props.target).toBe('_blank');
      expect(links[0].props.children).toBe('this source');
    });
  });

  describe('happy path: link at start or end', () => {
    test('parses link at the start of text', () => {
      const text = '{link:IBGE|https://ibge.gov.br} census data 2022';
      const result = parseReference(text);

      expect(result).toHaveLength(2);
      expect(result[1]).toBe(' census data 2022');

      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.href).toBe('https://ibge.gov.br');
      expect(links[0].props.children).toBe('IBGE');
    });

    test('parses link at the end of text', () => {
      const text = 'Source: {link:SEADE data|https://seade.gov.br}';
      const result = parseReference(text);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Source: ');

      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.href).toBe('https://seade.gov.br');
      expect(links[0].props.children).toBe('SEADE data');
    });

    test('parses link when it is the entire text', () => {
      const text = '{link:Click here|https://example.com}';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.href).toBe('https://example.com');
      expect(links[0].props.children).toBe('Click here');
    });
  });

  describe('happy path: multiple links', () => {
    test('parses two links with text between them', () => {
      const text =
        '{link:SEADE|https://seade.gov.br} and {link:IBGE|https://ibge.gov.br} data';
      const result = parseReference(text);

      expect(result).toHaveLength(4);
      expect(result[1]).toBe(' and ');
      expect(result[3]).toBe(' data');

      const links = findLinkElements(result);
      expect(links).toHaveLength(2);
      expect(links[0].props.href).toBe('https://seade.gov.br');
      expect(links[0].props.children).toBe('SEADE');
      expect(links[1].props.href).toBe('https://ibge.gov.br');
      expect(links[1].props.children).toBe('IBGE');
    });

    test('parses consecutive links without text between them', () => {
      const text = '{link:A|https://a.com}{link:B|https://b.com}';
      const result = parseReference(text);

      expect(result).toHaveLength(2);

      const links = findLinkElements(result);
      expect(links).toHaveLength(2);
      expect(links[0].props.href).toBe('https://a.com');
      expect(links[0].props.children).toBe('A');
      expect(links[1].props.href).toBe('https://b.com');
      expect(links[1].props.children).toBe('B');
    });

    test('parses three links with varied text spacing', () => {
      const text =
        'Sources: {link:SEADE|https://seade.gov.br},{link:IBGE|https://ibge.gov.br} and {link:TSE|https://tse.jus.br}';
      const result = parseReference(text);

      expect(result).toHaveLength(6);
      expect(result[0]).toBe('Sources: ');
      expect(result[2]).toBe(',');
      expect(result[4]).toBe(' and ');

      const links = findLinkElements(result);
      expect(links).toHaveLength(3);
      expect(links[0].props.href).toBe('https://seade.gov.br');
      expect(links[1].props.href).toBe('https://ibge.gov.br');
      expect(links[2].props.href).toBe('https://tse.jus.br');
    });
  });

  describe('happy path: unsafe URLs rejected', () => {
    test('renders text only for javascript: protocol', () => {
      const text = 'Click {link:here|javascript:alert(1)} for more.';
      const result = parseReference(text);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Click ');
      expect(result[1]).toBe('here');
      expect(result[2]).toBe(' for more.');
    });

    test('renders text only for data: protocol', () => {
      const text = '{link:SVG image|data:image/svg+xml;base64,abc}';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('SVG image');
    });

    test('renders text only for file: protocol', () => {
      const text = 'Open {link:file|file:///etc/passwd} locally.';
      const result = parseReference(text);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Open ');
      expect(result[1]).toBe('file');
      expect(result[2]).toBe(' locally.');
    });

    test('renders text only for malformed/no protocol', () => {
      const text = 'See {link:relative|/local/path} here.';
      const result = parseReference(text);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe('See ');
      expect(result[1]).toBe('relative');
      expect(result[2]).toBe(' here.');
    });

    test('mixed safe and unsafe URLs in same text', () => {
      const text =
        '{link:Safe|https://safe.com} and {link:Unsafe|javascript:void(0)}';
      const result = parseReference(text);

      expect(result).toHaveLength(3);
      expect(result[1]).toBe(' and ');

      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.href).toBe('https://safe.com');
      expect(links[0].props.children).toBe('Safe');

      // Unsafe text should be present as plain string
      expect(extractTextContent(result)).toContain('Unsafe');
    });
  });

  describe('real-world case: SEADE legend reference', () => {
    test('parses SEADE population data reference with link', () => {
      const text =
        'Dados agregados por distrito municipal a partir das {link:projeções populacionais por sexo e idade do SEADE|https://repositorio.seade.gov.br/dataset/populacao-residente-municipio-de-sao-paulo-evolucao} para o ano de 2025. Geometria: Distritos Municipais de São Paulo.';
      const result = parseReference(text);

      expect(result.length).toBeGreaterThan(1);

      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.href).toBe(
        'https://repositorio.seade.gov.br/dataset/populacao-residente-municipio-de-sao-paulo-evolucao'
      );
      expect(links[0].props.children).toBe(
        'projeções populacionais por sexo e idade do SEADE'
      );
      expect(links[0].props.target).toBe('_blank');

      // Verify full text is preserved
      const fullText = extractTextContent(result);
      expect(fullText).toContain('Dados agregados');
      expect(fullText).toContain('projeções populacionais');
      expect(fullText).toContain('Geometria: Distritos');
    });
  });

  describe('edge cases: malformed or boundary patterns', () => {
    test('ignores link pattern with missing pipe separator', () => {
      const text = 'See {link:text https://example.com} here.';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(text);
    });

    test('ignores link pattern with unclosed braces', () => {
      const text = 'See {link:text|https://example.com here.';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(text);
    });

    test('does not process link with newline in link text', () => {
      const text = 'See {link:text\nwith newline|https://example.com} here.';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(text);
    });

    test('does not process link with newline in URL', () => {
      const text = 'See {link:text|https://example.com/path\nfull} here.';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(text);
    });

    test('does not process nested braces in link pattern', () => {
      const text = 'See {link:text|https://example.com/path{nested}} here.';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(text);
    });

    test('handles URLs with query strings and fragments', () => {
      const text =
        'See {link:docs|https://example.com/page?section=intro#top} here.';
      const result = parseReference(text);

      expect(result).toHaveLength(3);
      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.href).toBe(
        'https://example.com/page?section=intro#top'
      );
    });

    test('handles URLs with encoded characters', () => {
      const text =
        'See {link:encoded|https://example.com/search?q=%20space%2Fslash} here.';
      const result = parseReference(text);

      expect(result).toHaveLength(3);
      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.href).toBe(
        'https://example.com/search?q=%20space%2Fslash'
      );
    });
  });

  describe('edge cases: link text variations', () => {
    test('handles link text with multiple spaces', () => {
      const text = '{link:Multiple  spaces  in  text|https://example.com}';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.children).toBe('Multiple  spaces  in  text');
    });

    test('handles link text with punctuation', () => {
      const text = '{link:IBGE Censo (2020)|https://ibge.gov.br}';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.children).toBe('IBGE Censo (2020)');
    });

    test('handles link text with dashes and underscores', () => {
      const text = '{link:doc_name-2025|https://example.com}';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.children).toBe('doc_name-2025');
    });

    test('handles link text with unicode characters', () => {
      const text = '{link:Dados de São Paulo — 2025|https://seade.gov.br}';
      const result = parseReference(text);

      expect(result).toHaveLength(1);
      const links = findLinkElements(result);
      expect(links).toHaveLength(1);
      expect(links[0].props.children).toBe('Dados de São Paulo — 2025');
    });
  });
});
