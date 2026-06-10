import { useState, useEffect, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number = 600): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const previousValueRef = useRef<T>(value);

    useEffect(() => {
        // Если значение реально изменилось, запускаем таймер
        if (value !== previousValueRef.current) {
            previousValueRef.current = value;
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);
            return () => clearTimeout(handler);
        }
    }, [value, delay]);

    return debouncedValue;
}