"use client";

import Link from "next/link";
import { Button } from "@repo/ui/button";
import Spinner from "../Spinner";
import styles from "../../app/page.module.css";

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
      {error && <p className="text-sm text-red-500">{error}</p>}
      {oauthUrl ? (
        <Link href={oauthUrl}>
          <Button appName="web" className={styles.secondary}>連結 Strava</Button>
        </Link>
      ) : (
        <Spinner size={40} />
      )}
    </>
  );
};

export default StravaConnectSection;

