export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.') {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const response = 'response' in error ? error.response : undefined;
  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return fallback;
  }

  const data = response.data;
  if (typeof data !== 'object' || data === null || !('message' in data)) {
    return fallback;
  }

  const message = data.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === 'string').join(', ') || fallback;
  }

  if (typeof message === 'object' && message !== null && 'message' in message) {
    const nestedMessage = message.message;
    if (typeof nestedMessage === 'string') {
      return nestedMessage;
    }
    if (Array.isArray(nestedMessage)) {
      return nestedMessage
        .filter((item): item is string => typeof item === 'string')
        .join(', ') || fallback;
    }
  }

  return fallback;
}