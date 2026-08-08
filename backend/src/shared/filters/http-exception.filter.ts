import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter
  implements ExceptionFilter
{
  catch(
    exception: HttpException,
    host: ArgumentsHost,
  ) {
    const response =
      host.switchToHttp().getResponse();

    response.status(exception.getStatus()).json({
      success: false,
      message: exception.message,
    });
  }
}