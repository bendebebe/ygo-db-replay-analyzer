import { GraphQLScalarType, Kind } from 'graphql';

export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  
  // Convert outgoing Date to string
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value).toISOString();
    }
    throw new Error('GraphQL Date Scalar serializer expected a Date object');
  },
  
  // Convert incoming string to Date
  parseValue(value: unknown): Date {
    if (typeof value === 'string') {
      return new Date(value);
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    throw new Error('GraphQL Date Scalar parser expected a string or number');
  },
  
  // Parse AST literals to Date
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    throw new Error('GraphQL Date Scalar literal expected a string or integer');
  },
}); 