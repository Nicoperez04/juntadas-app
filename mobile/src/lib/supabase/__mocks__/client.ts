import { jest } from '@jest/globals';

export interface SupabaseQueryResult {
  data: unknown;
  error: { message: string } | null;
  count: number | null;
}

export interface QueryBuilder extends PromiseLike<SupabaseQueryResult> {
  select: (columns?: string, options?: unknown) => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  neq: (column: string, value: unknown) => QueryBuilder;
  single: () => Promise<{ data: unknown; error: { message: string } | null }>;
  maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
  update: (values: unknown) => QueryBuilder;
  is: (column: string, value: unknown) => QueryBuilder;
  insert: (values: unknown) => QueryBuilder;
  delete: () => QueryBuilder;
  in: (column: string, values: unknown[]) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
}

// Mocks para Auth
export const mockSignUp = jest.fn<() => Promise<{ data: unknown; error: { message: string } | null }>>();
export const mockSignInWithPassword = jest.fn<() => Promise<{ data: unknown; error: { message: string } | null }>>();
export const mockSignOut = jest.fn<() => Promise<{ error: { message: string } | null }>>();
export const mockResetPasswordForEmail = jest.fn<() => Promise<{ error: { message: string } | null }>>();
export const mockUpdateUser = jest.fn<() => Promise<{ error: { message: string } | null }>>();
export const mockGetSession = jest.fn<() => Promise<{ data: { session: unknown }; error: { message: string } | null }>>();
export const mockSetSession = jest.fn<() => Promise<{ error: { message: string } | null }>>();

// Mocks para base de datos (from)
export const mockSelect = jest.fn<(columns?: string, options?: unknown) => QueryBuilder>();
export const mockEq = jest.fn<(column: string, value: unknown) => QueryBuilder>();
export const mockNeq = jest.fn<(column: string, value: unknown) => QueryBuilder>();
export const mockSingle = jest.fn<() => Promise<{ data: unknown; error: { message: string } | null }>>();
export const mockMaybeSingle = jest.fn<() => Promise<{ data: unknown; error: { message: string } | null }>>();
export const mockUpdate = jest.fn<(values: unknown) => QueryBuilder>();
export const mockIs = jest.fn<(column: string, value: unknown) => QueryBuilder>();
export const mockInsert = jest.fn<(values: unknown) => QueryBuilder>();
export const mockDelete = jest.fn<() => QueryBuilder>();
export const mockIn = jest.fn<(column: string, values: unknown[]) => QueryBuilder>();
export const mockOrder = jest.fn<(column: string, options?: { ascending?: boolean }) => QueryBuilder>();

// Mock para resolución Thenable (para cualquier await al builder)
export const mockThen = jest.fn<() => Promise<SupabaseQueryResult>>();

// Mock para RPC
export const mockRpc = jest.fn<(fnName: string, params?: unknown) => Promise<{ data: unknown; error: { message: string } | null }>>();

// Mocks para Storage
export const mockUpload = jest.fn<() => Promise<{ error: { message: string } | null }>>();
export const mockGetPublicUrl = jest.fn<() => { data: { publicUrl: string } }>();
export const mockRemove = jest.fn<(paths: string[]) => Promise<{ data: unknown; error: { message: string } | null }>>();

// Mocks para Edge Functions
export const mockInvoke = jest.fn<() => Promise<{ data: unknown; error: { message: string } | null }>>();

// Estructura de encadenamiento para consultas (Builder pattern)
const queryBuilder: QueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  neq: mockNeq,
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
  update: mockUpdate,
  is: mockIs,
  insert: mockInsert,
  delete: mockDelete,
  in: mockIn,
  order: mockOrder,
  then<TResult1 = SupabaseQueryResult, TResult2 = never>(
    onfulfilled?: ((value: SupabaseQueryResult) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return mockThen().then(onfulfilled, onrejected);
  },
};

// Implementación del encadenamiento para que devuelva el mismo builder
mockSelect.mockImplementation(() => queryBuilder);
mockEq.mockImplementation(() => queryBuilder);
mockNeq.mockImplementation(() => queryBuilder);
mockUpdate.mockImplementation(() => queryBuilder);
mockIs.mockImplementation(() => queryBuilder);
mockInsert.mockImplementation(() => queryBuilder);
mockDelete.mockImplementation(() => queryBuilder);
mockIn.mockImplementation(() => queryBuilder);
mockOrder.mockImplementation(() => queryBuilder);

// Resoluciones por defecto
mockThen.mockResolvedValue({ data: null, error: null, count: 0 });
mockSingle.mockResolvedValue({ data: {}, error: null });
mockMaybeSingle.mockResolvedValue({ data: null, error: null });

const storageBucketMock = {
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
  remove: mockRemove,
};

export const supabase = {
  auth: {
    signUp: mockSignUp,
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPasswordForEmail,
    updateUser: mockUpdateUser,
    getSession: mockGetSession,
    setSession: mockSetSession,
  },
  from: jest.fn().mockImplementation(() => queryBuilder),
  rpc: mockRpc,
  storage: {
    from: jest.fn().mockImplementation(() => storageBucketMock),
  },
  functions: {
    invoke: mockInvoke,
  },
};
