import './globals.css';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit">
          {children}
          <CopilotPopup
            instructions="You are a helpful assistant for the Agent Orchestra system. Help users orchestrate AI agents, analyze repositories, and manage multi-agent workflows."
            labels={{
              title: 'Agent Orchestra Assistant',
              initial: 'How can I help you orchestrate agents today?',
            }}
          />
        </CopilotKit>
      </body>
    </html>
  );
}
