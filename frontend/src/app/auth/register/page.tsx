import { AuthHeroPanel } from '@/components/auth/AuthHeroPanel';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen overflow-hidden lg:grid-cols-2">
      <AuthHeroPanel
        eyebrow="Empowering Ethiopian Educators"
        headline={<>Welcome to<br />ServeLink</>}
        description="Join the largest professional community for teachers to collaborate, share resources and grow together."
        stats={[
          { value: '15K+', label: 'Active Teachers' },
          { value: '500+', label: 'Communities' },
        ]}
      />

      <section className="flex items-center justify-center overflow-y-auto bg-slate-50 px-6 py-6">
        <RegisterForm />
      </section>
    </main>
  );
}
