import { HttpException, HttpStatus } from "@nestjs/common";

export const runMeErrorHelper = (error: any) => {
    throw new HttpException(
      {
        statusCode:
          error?.['cause']?.['status'] ||
          error?.status ||
          HttpStatus.INTERNAL_SERVER_ERROR,
        error:
          error?.['cause']?.['message'] ||
          error?.message ||
          error?.error ||
          'Error',
      },
      error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      {
        cause: error,
      },
    );
  };