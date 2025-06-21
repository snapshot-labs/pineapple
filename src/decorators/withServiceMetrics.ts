import {
  serviceDuration,
  serviceOpenConnections,
  serviceReturnCount,
  serviceSize
} from '../helpers/metrics';
import { getDataSize } from '../helpers/utils';

export interface MetricsContext {
  protocol: string;
  serviceType: 'provider' | 'proxy';
  operationType: 'image' | 'json' | 'resolve';
}

export interface ServiceMethod<T = any, R = any> {
  (...args: T[]): Promise<R>;
}

export interface Service {
  id: string;
  [key: string]: any;
}

/**
 * Generic decorator that adds metrics instrumentation to any service method
 */
export function withServiceMetrics<S extends Service, T = any, R = any>(
  service: S,
  method: keyof S,
  context: MetricsContext
): S {
  const originalMethod = service[method] as ServiceMethod<T, R>;
  const { protocol, serviceType, operationType } = context;
  const labels = {
    name: service.id,
    service_type: serviceType,
    operation_type: operationType,
    protocol
  };

  const instrumentedMethod = async (...args: T[]): Promise<R> => {
    const end = serviceDuration.startTimer(labels);
    let status = 0;

    try {
      serviceOpenConnections.inc(labels);

      const result = await originalMethod.apply(service, args);

      // Track size for providers only (proxies don't have upload data)
      if (serviceType === 'provider' && args.length > 0) {
        const size = getDataSize(args[0]);
        serviceSize.inc(labels, size);
      }

      // Track successful returns for all services
      serviceReturnCount.inc(labels);

      status = 1;
      return result;
    } finally {
      end({ status, protocol });
      serviceOpenConnections.dec(labels);
    }
  };

  return {
    ...service,
    [method]: instrumentedMethod
  } as S;
}
