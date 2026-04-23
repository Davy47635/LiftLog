describe('seedDatabase', () => {
    it('inserts the correct number of categories', () => {
        const categories = [
            { name: 'Chest', colour: '#FF3B5C', icon: 'barbell-outline' },
            { name: 'Back', colour: '#4F6EF7', icon: 'body-outline' },
            { name: 'Legs', colour: '#FF9F0A', icon: 'walk-outline' },
            { name: 'Shoulders', colour: '#30D158', icon: 'fitness-outline' },
            { name: 'Arms', colour: '#BF5AF2', icon: 'flash-outline' },
            { name: 'Cardio', colour: '#FF6B35', icon: 'heart-outline' },
        ];
        expect(categories).toHaveLength(6);
        expect(categories[0].name).toBe('Chest');
    });

    it('inserts the correct number of targets', () => {
        const targets = [
            { period: 'weekly', targetValue: 4 },
            { period: 'weekly', targetValue: 2 },
            { period: 'monthly', targetValue: 16 },
        ];
        expect(targets).toHaveLength(3);
        expect(targets[0].period).toBe('weekly');
    });
});
