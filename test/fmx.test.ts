import { Fmx } from '../src';

describe('Fast Mutex', () => {
  it('Set A and B properly', async done => {
    const fmx = new Fmx();

    expect({
      A: localStorage.getItem('fmx_lock_A'),
      B: localStorage.getItem('fmx_lock_B'),
    }).toEqual({
      A: null,
      B: null,
    });

    await fmx.lock(() => {
      expect(localStorage.getItem('fmx_lock_A')).toEqual(
        localStorage.getItem('fmx_lock_B')
      );
    });

    expect(localStorage.getItem('fmx_lock_B')).toEqual('0');

    done();
  });
});
