import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid h-screen overflow-hidden lg:grid-cols-2">
      { }
      <section
        className="relative hidden items-center justify-center bg-cover bg-center p-16 text-center text-white lg:flex"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200')",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/60" />

        <div className="relative z-10 w-full max-w-lg">
          <span className="inline-flex rounded-full bg-[#FFC107] px-4 py-2 text-sm font-semibold text-[#043658] shadow-md">
            Empowering Ethiopian Educators
          </span>

          <h1 className="mt-6 text-6xl font-bold">
            Welcome to
            <br />
            ServeLink
          </h1>

          <p className="mt-6 text-lg text-blue-100">
            Join the largest professional community for teachers to
            collaborate, share resources and grow together.
          </p>

          <div className="mt-10 flex justify-center gap-10">
            <div>
              <h2 className="text-3xl font-bold">15K+</h2>
              <p>Active Teachers</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold">500+</h2>
              <p>Communities</p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="flex items-center justify-center bg-slate-50">
        <LoginForm />
      </section>
    </main>
  );
}