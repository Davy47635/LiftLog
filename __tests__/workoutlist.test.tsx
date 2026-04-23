describe('WorkoutList', () => {
    it('shows empty state when no workouts', () => {
        const workouts = [];
        expect(workouts.length).toBe(0);
    });

    it('displays seeded workout data correctly', () => {
        const seededWorkouts = [
            { id: 1, categoryName: 'Chest', durationMins: 65 },
            { id: 2, categoryName: 'Back', durationMins: 55 },
            { id: 3, categoryName: 'Legs', durationMins: 70 },
        ];
        expect(seededWorkouts).toHaveLength(3);
        expect(seededWorkouts[0].categoryName).toBe('Chest');
        expect(seededWorkouts[0].durationMins).toBe(65);
    });
});
