/* eslint-disable no-console */
import { fireEvent, render } from '@ttoss/test-utils/react';
import { useStorage } from 'src/index';

const TestComponent = ({ storage }: { storage?: Storage }) => {
  const [data, setData] = useStorage('username', 'John Doe', { storage });
  return (
    <>
      <p>{data}</p>
      <button
        id="set-data"
        onClick={() => {
          setData('Burt');
        }}
      >
        Change Username
      </button>
      <button
        id="set-data-callback"
        onClick={() => {
          setData((data) => {
            return data + 'foo';
          });
        }}
      >
        Change Username
      </button>
      <button
        id="remove-data"
        onClick={() => {
          setData(undefined);
        }}
      >
        Remove Username
      </button>
    </>
  );
};

const WithCustomParser = () => {
  const [data] = useStorage('username', 'John Doe', {
    parser: (val) => {
      return JSON.parse(val) + 'kraw';
    },
  });
  return <p>{data}</p>;
};

const WithCustomSerializer = () => {
  const [data] = useStorage('username', 'John Doe', {
    serializer: (val) => {
      return JSON.stringify(val + 'char');
    },
  });
  return <p>{data}</p>;
};

const WithBadParser = () => {
  const [data] = useStorage('username', 'John Doe', {
    parser: () => {
      return JSON.parse(undefined as unknown as string);
    },
  });
  return <p>{data}</p>;
};

const WithBadSerializer = () => {
  const [data] = useStorage('username', 'John Doe', {
    serializer: () => {
      return JSON.parse(undefined as unknown as string);
    },
  });
  return <p>{data}</p>;
};

const WithDisabledSync = () => {
  const [data] = useStorage('username', 'John Doe', {
    syncData: false,
  });
  return <p>{data}</p>;
};

const WithMultipleSetterCallback = () => {
  const [data, setData] = useStorage('username', 'foo');

  return (
    <>
      <p>{data}</p>
      <button
        id="set-data-multiple-callback"
        onClick={() => {
          setData((data) => {
            return data + 'bar';
          });
          setData((data) => {
            return data + 'bar';
          });
          setData((data) => {
            return data + 'bar';
          });
          setData((data) => {
            return data + 'bar';
          });
        }}
      >
        Change Username
      </button>
    </>
  );
};

const CountRenders = ({ counter }: { counter: { value: number } }) => {
  const [data, setData] = useStorage('username', 'foo');
  counter.value++;
  return (
    <>
      <p>{data}</p>
      <button
        id="stability"
        onClick={() => {
          return setData((data) => {
            return data + 'bar';
          });
        }}
      >
        Change Username
      </button>
    </>
  );
};

describe('useStorage using default storage (localStorage)', () => {
  const createStorageEventOption = (
    key: string,
    newValue: string | null,
    storage?: Storage
  ) => {
    return new StorageEvent('storage', {
      newValue,
      key,
      oldValue: null,
      storageArea: storage ?? window.localStorage,
    });
  };

  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'error');
    jest.spyOn(console, 'log');
    // @ts-expect-error jest.spyOn adds this functionality
    console.log.mockImplementation(() => {
      return null;
    });
    // @ts-expect-error jest.spyOn adds this functionality
    console.error.mockImplementation(() => {
      return null;
    });
  });

  afterEach(() => {
    // @ts-expect-error jest.spyOn adds this functionality
    console.log.mockRestore();
    // @ts-expect-error jest.spyOn adds this functionality
    console.error.mockRestore();
  });

  test('sets localStorage based on default value', () => {
    const { container } = render(<TestComponent />);
    expect(localStorage.getItem('username')).toEqual(
      JSON.stringify('John Doe')
    );
    expect(container.querySelector('p')).toHaveTextContent('John Doe');
  });

  test('gets localStorage value instead of default', () => {
    localStorage.setItem('username', JSON.stringify('Daffodil'));
    const { container } = render(<TestComponent />);
    expect(container.querySelector('p')).toHaveTextContent('Daffodil');
  });

  test('changes localstorage and state value', () => {
    localStorage.setItem('username', JSON.stringify('Daffodil'));
    const { container } = render(<TestComponent />);
    fireEvent.click(container.querySelector('#set-data'));
    expect(container.querySelector('p')).toHaveTextContent('Burt');
    expect(localStorage.getItem('username')).toBe(JSON.stringify('Burt'));
  });

  test('changes localstorage and state value using callback', () => {
    localStorage.setItem('username', JSON.stringify('Daffodil'));
    const { container } = render(<TestComponent />);
    fireEvent.click(container.querySelector('#set-data-callback'));
    expect(container.querySelector('p')).toHaveTextContent('Daffodilfoo');
    expect(localStorage.getItem('username')).toBe(
      JSON.stringify('Daffodilfoo')
    );
  });

  test('changes localStorage and state value correctly for multiple setter callbacks', () => {
    const { container } = render(<WithMultipleSetterCallback />);
    fireEvent.click(container.querySelector('#set-data-multiple-callback'));
    expect(container.querySelector('p')).toHaveTextContent('foobarbarbarbar');
    expect(localStorage.getItem('username')).toBe(
      JSON.stringify('foobarbarbarbar')
    );
  });

  test('uses a custom parser', () => {
    localStorage.setItem('username', JSON.stringify('johndoe85'));
    const { container } = render(<WithCustomParser />);
    expect(container.querySelector('p')).toHaveTextContent('johndoe85kraw');
  });

  test('uses a custom serializer', () => {
    render(<WithCustomSerializer />);
    expect(localStorage.getItem('username')).toBe(
      JSON.stringify('John Doechar')
    );
  });

  test('handles malformed local storage data', () => {
    localStorage.setItem('username', JSON.stringify('some data'));
    const { container } = render(<WithBadParser />);
    expect(console.log).toHaveBeenCalled();
    expect(container.querySelector('p')).toHaveTextContent('John Doe');
  });

  test('handles bad serializer', () => {
    render(<WithBadSerializer />);
    expect(console.log).toHaveBeenCalled();
  });

  test('should sync data from other tab', () => {
    const { container } = render(<TestComponent />);

    fireEvent(
      window,
      createStorageEventOption('username', JSON.stringify('Test Sync'))
    );
    expect(container.querySelector('p')).toHaveTextContent('Test Sync');
  });

  test('should not sync data from other tab when sync disabled', () => {
    const { container } = render(<WithDisabledSync />);

    fireEvent(
      window,
      createStorageEventOption('username', JSON.stringify('Test Sync'))
    );
    expect(container.querySelector('p')).toHaveTextContent('John Doe');
  });

  test('should not sync data from other tab when key is different', () => {
    const { container } = render(<TestComponent />);

    fireEvent(
      window,
      createStorageEventOption('otherkey', JSON.stringify('Test Sync'))
    );
    expect(container.querySelector('p')).toHaveTextContent('John Doe');
  });

  test('should not sync data from other tab when event is from other storage', () => {
    const { container } = render(<TestComponent />);

    fireEvent(
      window,
      createStorageEventOption(
        'username',
        JSON.stringify('Test Sync'),
        window.sessionStorage
      )
    );
    expect(container.querySelector('p')).toHaveTextContent('John Doe');
  });

  test('should log on storage sync error', () => {
    render(<TestComponent />);

    fireEvent(window, createStorageEventOption('username', 'malformed'));
    expect(console.log).toHaveBeenCalled();
  });

  test('should return undefined when other tab deletes storage item', () => {
    const { container } = render(<TestComponent />);

    fireEvent(window, createStorageEventOption('username', null));
    expect(container.querySelector('p')).toHaveTextContent('');
  });

  test('should remove item from localStorage when value is set as undefined', () => {
    const { container } = render(<TestComponent />);

    fireEvent.click(container.querySelector('#remove-data'));
    expect(container.querySelector('p')).toHaveTextContent('');
    expect(localStorage.getItem('username')).toBe(null);
  });

  test('should be able to set value again after it was removed from localStorage', () => {
    const { container } = render(<TestComponent />);

    fireEvent.click(container.querySelector('#remove-data'));
    fireEvent.click(container.querySelector('#set-data'));
    expect(localStorage.getItem('username')).toBe(JSON.stringify('Burt'));
  });

  test('triggers a re-render only the needed amount of times', () => {
    const counter = { value: 0 };
    expect(counter.value).toBe(0);
    const { container } = render(<CountRenders counter={counter} />);
    expect(counter.value).toBe(1);
    fireEvent.click(container.querySelector('#stability'));
    expect(counter.value).toBe(2);
    expect(localStorage.getItem('username')).toEqual(JSON.stringify('foobar'));
  });
});

describe('useStorage using sessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.spyOn(console, 'error');
    jest.spyOn(console, 'log');
    // @ts-expect-error jest.spyOn adds this functionality
    console.log.mockImplementation(() => {
      return null;
    });
    // @ts-expect-error jest.spyOn adds this functionality
    console.error.mockImplementation(() => {
      return null;
    });
  });

  afterEach(() => {
    // @ts-expect-error jest.spyOn adds this functionality
    console.log.mockRestore();
    // @ts-expect-error jest.spyOn adds this functionality
    console.error.mockRestore();
  });

  test('sets sessionStorage based on default value', () => {
    const { container } = render(<TestComponent storage={sessionStorage} />);
    expect(sessionStorage.getItem('username')).toEqual(
      JSON.stringify('John Doe')
    );
    expect(container.querySelector('p')).toHaveTextContent('John Doe');
  });

  test('gets sessionStorage value instead of default', () => {
    sessionStorage.setItem('username', JSON.stringify('Daffodil'));
    const { container } = render(<TestComponent storage={sessionStorage} />);
    expect(container.querySelector('p')).toHaveTextContent('Daffodil');
  });

  test('changes sessionStorage and state value', () => {
    sessionStorage.setItem('username', JSON.stringify('Daffodil'));
    const { container } = render(<TestComponent storage={sessionStorage} />);
    fireEvent.click(container.querySelector('#set-data'));
    expect(container.querySelector('p')).toHaveTextContent('Burt');
    expect(sessionStorage.getItem('username')).toBe(JSON.stringify('Burt'));
  });

  test('changes sessionStorage and state value using callback', () => {
    sessionStorage.setItem('username', JSON.stringify('Daffodil'));
    const { container } = render(<TestComponent storage={sessionStorage} />);
    fireEvent.click(container.querySelector('#set-data-callback'));
    expect(container.querySelector('p')).toHaveTextContent('Daffodilfoo');
    expect(sessionStorage.getItem('username')).toBe(
      JSON.stringify('Daffodilfoo')
    );
  });
});
