import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiFailure<TDetails = unknown> = {
  success: false;
  message: string;
  errorCode: string;
  details?: TDetails;
};

export function apiSuccess<T>(data: T, message = "Operação realizada com sucesso", status = 200) {
  const responsePayload: ApiSuccess<T> = {
    success: true,
    message,
    data,
  };
  return NextResponse.json(responsePayload, { status });
}

export function apiFailure<TDetails = unknown>(
  message: string,
  errorCode: string,
  status = 400,
  details?: TDetails
) {
  const responsePayload: ApiFailure<TDetails> = {
    success: false,
    message,
    errorCode,
    details,
  };
  return NextResponse.json(responsePayload, { status });
}

export function badRequestResponse(message = "Requisição inválida.", details?: unknown) {
  return apiFailure(message, "BAD_REQUEST", 400, details);
}

export function unauthorizedResponse(message = "Autenticação obrigatória para acessar este recurso.") {
  return apiFailure(message, "UNAUTHORIZED", 401);
}

export function forbiddenResponse(message = "Você não possui permissão para executar esta ação.") {
  return apiFailure(message, "FORBIDDEN", 403);
}

export function tenantMismatchResponse(message = "Acesso negado: o recurso pertence a outra organização.") {
  return apiFailure(message, "TENANT_MISMATCH", 403);
}

export function notFoundResponse(message = "Recurso não encontrado.") {
  return apiFailure(message, "NOT_FOUND", 404);
}

export function conflictResponse(message: string, details?: unknown) {
  return apiFailure(message, "CONFLICT", 409, details);
}

export function validationErrorResponse(details: unknown, message = "Erro de validação nos dados fornecidos.") {
  return apiFailure(message, "VALIDATION_ERROR", 422, details);
}

export function internalErrorResponse(message = "Ocorreu um erro interno no servidor. Tente novamente mais tarde.") {
  return apiFailure(message, "INTERNAL_ERROR", 500);
}
