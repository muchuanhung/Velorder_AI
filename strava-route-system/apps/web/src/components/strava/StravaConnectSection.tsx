"use client";

import Link from "next/link";
import { Button } from "@repo/ui/button";
import Spinner from "@/components/Spinner";

interface StravaConnectSectionProps {
  oauthUrl: string | null;
  error: string | null;
}

const StravaConnectSection = ({
  oauthUrl,
  error,
}: StravaConnectSectionProps) => {
  return (
    <>
      {error && <p className="text-red-500">{error}</p>}
      {oauthUrl ? (
        <Link href={oauthUrl}>
          <Button appName="web" className="btn btn-primary">連結 Strava</Button>
        </Link>
      ) : (
        <Spinner color="#aaa" size={20} />
      )}
    </>
  );
};

export default StravaConnectSection;
