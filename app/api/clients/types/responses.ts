// Common Responses
import type { ApiResponse } from './generic-wrapper';
import type { AuthenticationTokenDto, CompanySummaryDto, InvitedUserTokenDto } from './models';

export type ApiResponseAuthenticationTokenDto = ApiResponse<AuthenticationTokenDto>;
export type ApiResponseCompanySummaryDto = ApiResponse<CompanySummaryDto>;
export type ApiResponseInvitedUserTokenDto = ApiResponse<InvitedUserTokenDto>;
export type ApiResponseString = ApiResponse<string>;
export type ApiResponseUnit = ApiResponse<void>;
