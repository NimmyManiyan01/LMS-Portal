import { StudentLoginPage } from "./StudentLoginPage";

interface Props {
  onBackToLanding: () => void;
  onAuthenticated: (user: { email: string; role: string }) => void;
}

export function AdminLoginPage({ onBackToLanding, onAuthenticated }: Props) {
  return (
    <StudentLoginPage
      initialAuthMode="ADMIN"
      allowRegistration={false}
      onBackToLanding={onBackToLanding}
      onRegister={onBackToLanding}
      onAuthenticated={onAuthenticated}
    />
  );
}
