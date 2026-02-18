const sections = [
  {
    title: 'Module Cross-Linking',
    description: 'Link tasks to habits and automatically capture focus time from Pomodoro sessions.',
    items: [
      'Task completion can trigger linked habit completions.',
      'Pomodoro work sessions write task time logs automatically.',
      'Reusable links for recurring routines and project workflows.',
    ],
  },
  {
    title: 'Smart Notifications',
    description: 'Context-aware reminders that adapt to behavior patterns and location cues.',
    items: [
      'Prioritize nudges when routines drift off schedule.',
      'Location metadata for arriving/leaving triggers.',
      'Quiet hours and preferred reminder windows.',
    ],
  },
  {
    title: 'Automation Rules',
    description: 'If-then rules to adjust plans based on sleep, mood, or workload.',
    items: [
      'Sleep under 6 hours? Suggest a lighter workout.',
      'High stress days? Schedule recovery breaks.',
      'Create tasks or reminders automatically from rules.',
    ],
  },
  {
    title: 'API Integrations',
    description: 'Connect external services to keep your data in sync.',
    items: [
      'Fitness trackers for workouts and biometrics.',
      'Banking providers for spending updates.',
      'Calendar services for two-way scheduling.',
    ],
  },
  {
    title: 'Voice Input',
    description: 'Capture entries fast with spoken commands.',
    items: [
      'Log tasks, habits, and notes hands-free.',
      'Intents mapped to quick actions and forms.',
      'Command history for audit and replay.',
    ],
  },
  {
    title: 'Batch Operations',
    description: 'Bulk update, archive, or delete entries with a single request.',
    items: [
      'Apply status changes across many tasks at once.',
      'Archive stale habits or notes in bulk.',
      'Reusable batch presets for common cleanups.',
    ],
  },
];

export function Automation() {
  return (
    <div className="p-6 md:p-8 max-w-content mx-auto space-y-8">
      <div>
        <h1 className="text-h1">Integration & Automation</h1>
        <p className="text-body mt-1">
          Connect modules, automate routines, and keep everything synchronized across services.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-border bg-bg-elevated p-5 shadow-soft-sm"
          >
            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            <p className="text-sm text-fg-muted mt-1">{section.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
