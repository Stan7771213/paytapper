import { getClientById } from "@/lib/clientStore";
import { StartOnboardingButton } from "./start-onboarding-button";
import { OpenStripeDashboardButton } from "./open-stripe-dashboard-button";

type DashboardPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function ClientDashboardPage({
  params,
  searchParams,
}: DashboardPageProps) {
  // ВАЖНО: params и searchParams — это Promise, их нужно "await"
  const { clientId } = await params;
  const search = (searchParams ? await searchParams : {}) ?? {};
  const onboardingParam = search.onboarding as
    | string
    | string[]
    | undefined;

  const client = getClientById(clientId);

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Client dashboard</h1>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Client info</h2>
        <p>
          <strong>Client ID:</strong> {clientId}
        </p>
        {client?.name && (
          <p>
            <strong>Name:</strong> {client.name}
          </p>
        )}
        {client?.email && (
          <p>
            <strong>Email:</strong> {client.email}
          </p>
        )}
        {!client && (
          <p className="text-sm text-gray-600">
            No client record yet. It will be created automatically after
            you start Stripe onboarding.
          </p>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Stripe account</h2>

        {client ? (
          <>
            <p>
              <strong>Stripe account ID:</strong>{" "}
              {client.stripeAccountId}
            </p>
            <p>
              <strong>Status:</strong> {client.status}
            </p>
            <p>
              <strong>Charges enabled:</strong>{" "}
              {client.chargesEnabled ? "Yes" : "No"}
            </p>
            <p>
              <strong>Payouts enabled:</strong>{" "}
              {client.payoutsEnabled ? "Yes" : "No"}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Stripe account is not created yet. Start onboarding to
            create it.
          </p>
        )}

        {onboardingParam === "return" && (
          <p className="text-sm text-green-600">
            You returned from Stripe onboarding. Your account status
            will update shortly.
          </p>
        )}

        {onboardingParam === "refresh" && (
          <p className="text-sm text-yellow-600">
            There was an issue with onboarding. Please try again.
          </p>
        )}

        {/* Кнопка онбординга Stripe */}
        <StartOnboardingButton clientId={clientId} />

        {/* Кнопка входа в Stripe Dashboard — только если клиент уже есть */}
        {client && (
          <div className="pt-3">
            <OpenStripeDashboardButton />
          </div>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">Tips overview</h2>
        <p className="text-sm text-gray-600">
          Tip history will appear here later.
        </p>
      </section>
    </main>
  );
}

