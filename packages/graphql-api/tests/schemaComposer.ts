/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ResolverResolveParams,
  composeWithConnection,
  composeWithRelay,
  fromGlobalId,
  schemaComposer,
  toGlobalId,
} from '../src';

type Book = {
  id: string;
  title: string;
  authorId?: string;
};

type Author = {
  pk: string;
  sk: string;
  name: string;
  books: Book[];
};

export const AUTHORS: Author[] = [
  {
    pk: 'author',
    sk: 'Amanda',
    name: 'Amanda',
    books: [
      {
        id: 'book#Amanda#1',
        title: 'The Book Amanda 1',
      },
      {
        id: 'book#Amanda#2',
        title: 'The Book Amanda 2',
      },
    ],
  },
  {
    pk: 'author',
    sk: 'Bob',
    name: 'Bob',
    books: [
      {
        id: 'book#Bob#1',
        title: 'The Book Bob 1',
      },
    ],
  },
  {
    pk: 'author',
    sk: 'Charlie',
    name: 'Charlie',
    books: [
      {
        id: 'book#Charlie#1',
        title: 'The Book Charlie 1',
      },
      {
        id: 'book#Charlie#2',
        title: 'The Book Charlie 2',
      },
      {
        id: 'book#Charlie#3',
        title: 'The Book Charlie 3',
      },
    ],
  },
  {
    pk: 'author',
    sk: 'David',
    name: 'David',
    books: [
      {
        id: 'book#David#1',
        title: 'The Book David 1',
      },
      {
        id: 'book#David#2',
        title: 'The Book David 2',
      },
      {
        id: 'book#David#3',
        title: 'The Book David 3',
      },
    ],
  },
  {
    pk: 'author',
    sk: 'Eve',
    name: 'Eve',
    books: [
      {
        id: 'book#Eve#1',
        title: 'The Book Eve 1',
      },
      {
        id: 'book#Eve#2',
        title: 'The Book Eve 2',
      },
      {
        id: 'book#Eve#3',
        title: 'The Book Eve 3',
      },
      {
        id: 'book#Eve#4',
        title: 'The Book Eve 4',
      },
      {
        id: 'book#Eve#5',
        title: 'The Book Eve 5',
      },
    ],
  },
];

export const BOOKS = AUTHORS.reduce<Book[]>((acc, author) => {
  const booksWithAuthor = author.books.map((book) => {
    return {
      ...book,
      authorId: [author.pk, author.sk].join('##'),
    };
  });
  return acc.concat(booksWithAuthor);
}, []);

const AuthorTC = schemaComposer.createObjectTC({
  name: 'Author',
  fields: {
    id: 'ID!',
    name: 'String!',
  },
});

AuthorTC.addResolver({
  name: 'findMany',
  type: [AuthorTC.NonNull],
  args: {
    first: 'Int',
    after: 'String',
    last: 'Int',
    before: 'String',
  },
  resolve: async () => {
    return AUTHORS;
  },
});

AuthorTC.addResolver({
  name: 'count',
  type: 'Int',
  resolve: async () => {
    return AUTHORS.length;
  },
});

AuthorTC.setRecordIdFn((source) => {
  return [source.pk, source.sk].join('##');
});

AuthorTC.addResolver({
  name: 'findById',
  description: 'Find a author by global ID. Used by node interface.',
  args: { id: 'ID!' },
  type: AuthorTC,
  resolve: async ({ args }: ResolverResolveParams<any, any, any>) => {
    const { recordId } = fromGlobalId(args.id);

    const [pk, sk] = recordId.split('##');

    return AUTHORS.find((author) => {
      return author.pk === pk && author.sk === sk;
    });
  },
});

composeWithRelay(AuthorTC);

composeWithConnection(AuthorTC, {
  findManyResolver: AuthorTC.getResolver('findMany'),
  countResolver: AuthorTC.getResolver('count'),
  sort: {
    ASC: {
      value: {
        scanIndexForward: true,
      },
      cursorFields: ['id'],
      // eslint-disable-next-line max-params, @typescript-eslint/no-unused-vars
      beforeCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) {
          rawQuery.id = {};
        }
        rawQuery.id.$lt = cursorData.id;
      },
      // eslint-disable-next-line max-params, @typescript-eslint/no-unused-vars
      afterCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) {
          rawQuery.id = {};
        }
        rawQuery.id.$gt = cursorData.id;
      },
    },
  },
});

schemaComposer.Query.addFields({
  author: AuthorTC.getResolver('findById'),
  authors: AuthorTC.getResolver('connection'),
});

const BookTC = schemaComposer.createObjectTC({
  name: 'Book',
  fields: {
    id: 'ID!',
    title: 'String!',
    authorId: 'String!',
  },
});

BookTC.addResolver({
  name: 'findMany',
  type: [BookTC.NonNull],
  args: {
    first: 'Int',
    after: 'String',
    last: 'Int',
    before: 'String',
  },
  resolve: async () => {
    return BOOKS.map((book) => {
      return book;
    });
  },
});

BookTC.addResolver({
  name: 'count',
  type: 'Int',
  resolve: async () => {
    return BOOKS.length;
  },
});

BookTC.setRecordIdFn((source) => {
  return source.id;
});

BookTC.addResolver({
  name: 'findById',
  description: 'Find a book by global ID. Used by node interface.',
  args: { id: 'ID!' },
  type: BookTC,
  resolve: async ({ args }: ResolverResolveParams<any, any, any>) => {
    const { recordId } = fromGlobalId(args.id);

    return BOOKS.find((book) => {
      return book.id === recordId;
    });
  },
});

BookTC.addRelation('author', {
  resolver: () => {
    return AuthorTC.getResolver('findById');
  },
  prepareArgs: {
    id: (source: any) => {
      return toGlobalId(AuthorTC.getTypeName(), source.authorId);
    },
  },
  projection: { authorId: true },
});

composeWithRelay(BookTC);

composeWithConnection(BookTC, {
  findManyResolver: BookTC.getResolver('findMany'),
  countResolver: BookTC.getResolver('count'),
  sort: {
    ASC: {
      value: {},
      cursorFields: ['id'],
      // eslint-disable-next-line max-params, @typescript-eslint/no-unused-vars
      beforeCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) {
          rawQuery.id = {};
        }
        rawQuery.id.$lt = cursorData.id;
      },
      // eslint-disable-next-line max-params, @typescript-eslint/no-unused-vars
      afterCursorQuery: (rawQuery, cursorData, resolveParams) => {
        if (!rawQuery.id) {
          rawQuery.id = {};
        }
        rawQuery.id.$gt = cursorData.id;
      },
    },
  },
});

schemaComposer.Query.addFields({
  book: BookTC.getResolver('findById'),
  books: BookTC.getResolver('connection'),
});

export { schemaComposer };
