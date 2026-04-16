// Realtime module for TaskFlow Dark
let channels = [];

/**
 * Set up realtime subscriptions for all user-facing tables
 * @param {object} supabase - Supabase client instance
 * @param {function} onChange - Callback function for changes
 */
export function setupRealtime(supabase, onChange) {
    // Clean up any existing channels
    teardownRealtime();
    
    // Subscribe to tasks table
    const tasksChannel = supabase
        .channel('app_bb61_tasks_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'app_bb61_tasks'
            },
            (payload) => {
                // Get current user
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user && payload.new && payload.new.user_id === user.id) {
                        onChange({
                            eventType: payload.eventType,
                            new: payload.new,
                            old: payload.old
                        });
                    }
                });
            }
        )
        .subscribe();
    
    channels.push(tasksChannel);
    
    console.log('Realtime subscriptions established');
}

/**
 * Remove all realtime channels
 */
export function teardownRealtime() {
    channels.forEach(channel => {
        channel.unsubscribe();
    });
    channels = [];
    console.log('Realtime subscriptions removed');
}