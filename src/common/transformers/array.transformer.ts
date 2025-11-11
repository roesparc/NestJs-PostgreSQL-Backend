import { Transform } from 'class-transformer';

export const ToArray = () =>
  Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : [value];
  });
