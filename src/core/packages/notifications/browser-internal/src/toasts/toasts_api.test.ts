/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { firstValueFrom } from 'rxjs';
import type { MountPoint, UnmountCallback } from '@kbn/core-mount-utils-browser';

import { ToastsApi } from './toasts_api';

import { apm } from '@elastic/apm-rum';
import { uiSettingsServiceMock } from '@kbn/core-ui-settings-browser-mocks';
import { renderingServiceMock } from '@kbn/core-rendering-browser-mocks';

jest.mock('@elastic/apm-rum', () => ({
  apm: {
    captureError: jest.fn(),
  },
}));

async function getCurrentToasts(toasts: ToastsApi) {
  return await firstValueFrom(toasts.get$());
}

type MockedUnmount = jest.MockedFunction<UnmountCallback>;

function uiSettingsMock() {
  const mock = uiSettingsServiceMock.createSetupContract();
  mock.get.mockImplementation((config: string) => {
    switch (config) {
      case 'notifications:lifetime:info':
        return 5000;
      case 'notifications:lifetime:warning':
        return 10000;
      case 'notifications:lifetime:error':
        return 30000;
      default:
        throw new Error(`Accessing ${config} is not supported in the mock.`);
    }
  });
  return mock;
}

function toastDeps() {
  return {
    uiSettings: uiSettingsMock(),
  };
}

function startDeps() {
  return {
    overlays: {} as any,
    rendering: renderingServiceMock.create(),
  };
}

describe('#get$()', () => {
  it('returns observable that emits NEW toast list when something added or removed', () => {
    const toasts = new ToastsApi(toastDeps());
    const onToasts = jest.fn();

    toasts.get$().subscribe(onToasts);
    const foo = toasts.add('foo');
    const bar = toasts.add('bar');
    toasts.remove(foo);

    expect(onToasts).toHaveBeenCalledTimes(4);

    const initial = onToasts.mock.calls[0][0];
    expect(initial).toEqual([]);

    const afterFoo = onToasts.mock.calls[1][0];
    expect(afterFoo).not.toBe(initial);
    expect(afterFoo).toEqual([foo]);

    const afterFooAndBar = onToasts.mock.calls[2][0];
    expect(afterFooAndBar).not.toBe(afterFoo);
    expect(afterFooAndBar).toEqual([foo, bar]);

    const afterRemoveFoo = onToasts.mock.calls[3][0];
    expect(afterRemoveFoo).not.toBe(afterFooAndBar);
    expect(afterRemoveFoo).toEqual([bar]);
  });

  it('does not emit a new toast list when unknown toast is passed to remove()', () => {
    const toasts = new ToastsApi(toastDeps());
    const onToasts = jest.fn();

    toasts.get$().subscribe(onToasts);
    toasts.add('foo');
    onToasts.mockClear();

    toasts.remove('bar');
    expect(onToasts).not.toHaveBeenCalled();
  });
});

describe('#add()', () => {
  it('returns toast objects with auto assigned id', () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.add({ title: 'foo' });
    expect(toast).toHaveProperty('id');
    expect(toast).toHaveProperty('title', 'foo');
  });

  it('adds the toast to toasts list', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.add({});

    const currentToasts = await getCurrentToasts(toasts);
    expect(currentToasts).toHaveLength(1);
    expect(currentToasts[0]).toBe(toast);
  });

  it('increments the toast ID for each additional toast', () => {
    const toasts = new ToastsApi(toastDeps());
    expect(toasts.add({})).toHaveProperty('id', '0');
    expect(toasts.add({})).toHaveProperty('id', '1');
    expect(toasts.add({})).toHaveProperty('id', '2');
  });

  it('accepts a string, uses it as the title', async () => {
    const toasts = new ToastsApi(toastDeps());
    expect(toasts.add('foo')).toHaveProperty('title', 'foo');
  });

  it('fallbacks to default values for undefined properties', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.add({ title: 'foo', toastLifeTimeMs: undefined });
    expect(toast.toastLifeTimeMs).toEqual(5000);
  });
});

describe('#remove()', () => {
  it('removes a toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    toasts.remove(toasts.add('Test'));
    expect(await getCurrentToasts(toasts)).toHaveLength(0);
  });

  it('ignores unknown toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    toasts.add('Test');
    toasts.remove('foo');

    const currentToasts = await getCurrentToasts(toasts);
    expect(currentToasts).toHaveLength(1);
  });
});

describe('#addInfo()', () => {
  it('adds a info toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    expect(toasts.addInfo({})).toHaveProperty('color', 'primary');
  });

  it('returns the created toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.addInfo({}, { toastLifeTimeMs: 1 });
    const currentToasts = await getCurrentToasts(toasts);
    expect(currentToasts[0].toastLifeTimeMs).toBe(1);
    expect(currentToasts[0]).toBe(toast);
  });

  it('fallbacks to default values for undefined properties', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.addInfo({ title: 'foo', toastLifeTimeMs: undefined });
    expect(toast.toastLifeTimeMs).toEqual(5000);
  });
});

describe('#addSuccess()', () => {
  it('adds a success toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    expect(toasts.addSuccess({})).toHaveProperty('color', 'success');
  });

  it('returns the created toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.addSuccess({});
    const currentToasts = await getCurrentToasts(toasts);
    expect(currentToasts[0]).toBe(toast);
  });

  it('fallbacks to default values for undefined properties', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.addSuccess({ title: 'foo', toastLifeTimeMs: undefined });
    expect(toast.toastLifeTimeMs).toEqual(5000);
  });
});

describe('#addWarning()', () => {
  it('adds a warning toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    expect(toasts.addWarning({})).toHaveProperty('color', 'warning');
  });

  it('returns the created toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.addWarning({});
    const currentToasts = await getCurrentToasts(toasts);
    expect(currentToasts[0]).toBe(toast);
  });

  it('fallbacks to default values for undefined properties', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.addWarning({ title: 'foo', toastLifeTimeMs: undefined });
    expect(toast.toastLifeTimeMs).toEqual(10000);
  });
});

describe('#addDanger()', () => {
  let unmounts: Record<string, MockedUnmount>;

  const createMountPoint =
    (id: string, content: string = id): MountPoint =>
    (root): MockedUnmount => {
      const container = document.createElement('DIV');
      // eslint-disable-next-line no-unsanitized/property
      container.innerHTML = content;
      root.appendChild(container);
      const unmount = jest.fn(() => container.remove());
      unmounts[id] = unmount;
      return unmount;
    };

  beforeEach(() => {
    unmounts = {};
  });

  it('adds a danger toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    expect(toasts.addDanger({})).toHaveProperty('color', 'danger');
    expect(apm.captureError).toBeCalledWith('No title or text is provided.', {
      labels: { error_type: 'ToastDanger' },
    });
  });

  it('returns the created toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.addDanger({});
    const currentToasts = await getCurrentToasts(toasts);
    expect(currentToasts[0]).toBe(toast);
    expect(apm.captureError).toBeCalledWith('No title or text is provided.', {
      labels: { error_type: 'ToastDanger' },
    });
  });

  it('fallbacks to default values for undefined properties', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.addDanger({
      title: 'toast title',
      text: 'toast text',
      toastLifeTimeMs: undefined,
    });
    expect(toast.toastLifeTimeMs).toEqual(10000);
    expect(apm.captureError).toBeCalledWith('Title: toast title, Text: toast text', {
      labels: { error_type: 'ToastDanger' },
    });
  });

  it('passes correct title and text to the apm.captureError when they are MountPoints', async () => {
    const toasts = new ToastsApi(toastDeps());
    const toast = toasts.addDanger({
      title: createMountPoint('Toast Title MountPoint'),
      text: createMountPoint('Toast Text MountPoint'),
      toastLifeTimeMs: undefined,
    });
    expect(toast.toastLifeTimeMs).toEqual(10000);
    expect(apm.captureError).toBeCalledWith(
      'Title: Toast Title MountPoint, Text: Toast Text MountPoint',
      {
        labels: { error_type: 'ToastDanger' },
      }
    );
  });

  it('passes correct title to the apm.captureError', async () => {
    const toasts = new ToastsApi(toastDeps());
    toasts.addDanger('Danger toast title');
    expect(apm.captureError).toBeCalledWith('Danger toast title', {
      labels: { error_type: 'ToastDanger' },
    });
  });
});

describe('#addError', () => {
  it('adds an error toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    toasts.start(startDeps());
    const error = new Error('unexpected error');
    const toast = toasts.addError(error, {
      title: 'Something went wrong',
      toastMessage: 'Please try again later.',
    });
    expect(toast).toHaveProperty('color', 'danger');
    expect(toast).toHaveProperty('title', 'Something went wrong');
    expect(toast).toHaveProperty('toastMessage', 'Please try again later.');
    expect(apm.captureError).toBeCalledWith(error, {
      labels: {
        error_type: 'ToastError',
        title: 'Something went wrong',
        toast_message: 'Please try again later.',
      },
    });
  });

  it('returns the created toast', async () => {
    const toasts = new ToastsApi(toastDeps());
    toasts.start(startDeps());
    const error = new Error('unexpected error');
    const toast = toasts.addError(error, { title: 'Something went wrong' });
    const currentToasts = await getCurrentToasts(toasts);
    expect(currentToasts[0]).toBe(toast);
    expect(apm.captureError).toBeCalledWith(error, {
      labels: { error_type: 'ToastError', title: 'Something went wrong' },
    });
  });
});
