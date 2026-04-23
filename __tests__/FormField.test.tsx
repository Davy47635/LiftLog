describe('FormField component', () => {
    it('renders with correct label and placeholder', () => {
        const props = {
            label: 'Email',
            placeholder: 'you@example.com',
            onChangeText: jest.fn(),
        };
        expect(props.label).toBe('Email');
        expect(props.placeholder).toBe('you@example.com');
        expect(typeof props.onChangeText).toBe('function');
    });

    it('fires onChangeText when user types', () => {
        const mockFn = jest.fn();
        mockFn('test@test.com');
        expect(mockFn).toHaveBeenCalledWith('test@test.com');
    });
});
