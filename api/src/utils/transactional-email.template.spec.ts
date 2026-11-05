import { renderTransactionalEmail } from './transactional-email.template';

function buildInput(
  overrides: Partial<Parameters<typeof renderTransactionalEmail>[0]> = {},
) {
  return {
    heading: 'Verify your email',
    bodyText: 'Click the button below to verify your email.',
    buttonText: 'Verify Email',
    buttonHref: 'https://example.com/verify-email?token=abc123',
    ...overrides,
  };
}

describe('renderTransactionalEmail', () => {
  it('includes the heading', () => {
    const html = renderTransactionalEmail(buildInput());

    expect(html).toContain('Verify your email');
  });

  it('includes the body text', () => {
    const html = renderTransactionalEmail(buildInput());

    expect(html).toContain('Click the button below to verify your email.');
  });

  it('renders a link to buttonHref with buttonText as the visible text', () => {
    const html = renderTransactionalEmail(buildInput());

    expect(html).toContain(
      '<a href="https://example.com/verify-email?token=abc123"',
    );
    expect(html).toContain('Verify Email');
  });

  it('includes the footnote when provided', () => {
    const html = renderTransactionalEmail(
      buildInput({ footnote: 'This link expires in 1 hour.' }),
    );

    expect(html).toContain('This link expires in 1 hour.');
  });

  it('omits the footnote section when not provided', () => {
    const html = renderTransactionalEmail(buildInput());

    expect(html).not.toContain('undefined');
  });

  it('greets the recipient by name when greetingName is provided', () => {
    const html = renderTransactionalEmail(buildInput({ greetingName: 'Jane' }));

    expect(html).toContain('Hi Jane,');
  });

  it('falls back to a generic greeting when greetingName is not provided', () => {
    const html = renderTransactionalEmail(buildInput());

    expect(html).toContain('Hello,');
  });
});
