import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad request' })
  message: string;

  @ApiProperty({ example: 'ValidationError' })
  error?: string;
}

export class PaginatedResponse<T> {
  @ApiProperty()
  items: T[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 0 })
  skip: number;

  @ApiProperty({ example: 10 })
  take: number;
}
