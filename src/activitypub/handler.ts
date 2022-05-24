export interface Handler<Request, Response> {
  handle(request: Request): Promise<Response>;
}
