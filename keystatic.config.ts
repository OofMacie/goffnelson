import { config, fields, collection } from '@keystatic/core';

export default config({
  storage:
    process.env.NODE_ENV === 'production'
      ? {
          kind: 'github',
          repo: {
            owner: process.env.GITHUB_REPO_OWNER!,
            name: process.env.GITHUB_REPO_NAME!,
          },
        }
      : { kind: 'local' },
  collections: {
    events: collection({
      label: 'Events',
      slugField: 'title',
      path: 'src/content/events/*',
      format: { contentField: 'body' },
      schema: {
        title: fields.slug({
          name: { label: 'Event Title' },
        }),
        date: fields.date({
          label: 'Event Date',
          validation: { isRequired: true },
        }),
        endDate: fields.date({
          label: 'End Date (optional)',
        }),
        time: fields.text({
          label: 'Time (e.g. 10:00 AM – 12:00 PM)',
        }),
        location: fields.text({
          label: 'Location',
        }),
        description: fields.text({
          label: 'Short Description',
          multiline: true,
          validation: { isRequired: true },
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Book Club', value: 'book-club' },
            { label: "Children's Program", value: 'childrens' },
            { label: 'Teen Program', value: 'teen' },
            { label: 'Adult Program', value: 'adult' },
            { label: 'Community Event', value: 'community' },
            { label: 'Other', value: 'other' },
          ],
          defaultValue: 'community',
        }),
        body: fields.document({
          label: 'Full Details',
          formatting: true,
          dividers: true,
          links: true,
          images: true,
        }),
      },
    }),

    articles: collection({
      label: 'Articles & News',
      slugField: 'title',
      path: 'src/content/articles/*',
      format: { contentField: 'body' },
      schema: {
        title: fields.slug({
          name: { label: 'Article Title' },
        }),
        publishDate: fields.date({
          label: 'Publish Date',
          validation: { isRequired: true },
        }),
        author: fields.text({
          label: 'Author',
          defaultValue: 'Goff Nelson Library Staff',
        }),
        description: fields.text({
          label: 'Short Description',
          multiline: true,
          validation: { isRequired: true },
        }),
        body: fields.document({
          label: 'Article Content',
          formatting: true,
          dividers: true,
          links: true,
          images: true,
        }),
      },
    }),
  },
});
