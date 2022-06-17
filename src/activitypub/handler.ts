export type ServiceMethod<Request, Response> = {
  Request: Request;
  Response: Response;
};

export interface Handler<Request, Response> {
  handle(request: Request): Promise<Response>;
}

export type ServiceMethodHandler<M> = M extends ServiceMethod<
  infer Request,
  infer Response
>
  ? Handler<Request, Response>
  : never;

export type ServiceMethodFunction<M> = M extends ServiceMethod<
  infer Request,
  infer Response
>
  ? (request: Request) => Promise<Response>
  : never;
