import { renderTemplate, templateVariables } from '../../../src';

test('replaces placeholders, with or without spaces, and leaves missing ones empty', () => {
  expect(
    renderTemplate({
      template: 'Olá, {{nome}} de {{ cidade }}! {{faltando}}{{ zero }}',
      variables: { nome: 'Ana', cidade: 'Curitiba', zero: 0, faltando: null },
    })
  ).toBe('Olá, Ana de Curitiba! 0');
  expect(renderTemplate({ template: 'Oi {{nome}}' })).toBe('Oi ');
});

test('escapes values in html mode only', () => {
  const variables = { nome: '<b>Ana</b>' };
  expect(
    renderTemplate({ template: '<p>{{nome}}</p>', variables, html: true })
  ).toBe('<p>&lt;b&gt;Ana&lt;/b&gt;</p>');
  expect(renderTemplate({ template: '{{nome}}', variables })).toBe(
    '<b>Ana</b>'
  );
});

test('templateVariables lists each name once', () => {
  expect(templateVariables('{{a}} {{ b }} {{a}} {b}')).toEqual(['a', 'b']);
});
