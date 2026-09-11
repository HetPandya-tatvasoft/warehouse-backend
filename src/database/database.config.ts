import { types } from 'pg';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
types.setTypeParser(20, (val: string) => parseInt(val, 10));
