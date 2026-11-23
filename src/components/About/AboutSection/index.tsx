import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";

const AboutSection = () => {
  return (
    <section className="px-4 pt-8 md:pt-20 lg:pt-28">
      <div className="container mx-auto">
        <div className="border-b border-body-color/[.15] pb-12 dark:border-white/[.15] md:pb-20 lg:pb-28">
          <Card className="mx-auto max-w-3xl border border-gray-200 bg-gray-50 shadow-lg dark:border-white/10 dark:bg-dark-6">
            <CardHeader className="flex-col items-center px-4 pt-6 text-center sm:px-8 sm:pt-8">
              <h2 className="text-2xl font-bold text-black dark:text-white sm:text-3xl">
                A private journal with AI that follows through
              </h2>
            </CardHeader>
            <CardBody className="px-4 pb-8 text-center sm:px-8 sm:pb-10">
              <p className="mx-auto mb-8 max-w-2xl text-base text-gray-600 dark:text-gray-400 sm:mb-10">
                Amorolle Journal is a reflective writing space paired with an AI assistant that can
                act on what you write — reminders, recaps, research, and everyday lists — with your
                consent. It is not therapy, does not diagnose, and is not a substitute for
                professional care. In a crisis, call or text 988.
              </p>
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
                <List text="Private, timestamped journal entries" />
                <List text="AI insights only with your opt-in" />
                <List text="Reminders and check-ins by text" />
                <List text="Lists, bills, and simple budgets" />
                <List text="Exclude any entry from AI analysis" />
                <List text="Crisis support points to 988" />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

const List = ({ text }: { text: string }) => (
  <p className="flex items-start text-base font-medium text-black dark:text-white">
    <span className="mr-3 flex h-[30px] w-[30px] items-center justify-center rounded-md bg-primary bg-opacity-10 text-primary">
      <svg width="16" height="13" viewBox="0 0 16 13" className="fill-current">
        <path d="M5.8535 12.6631C5.65824 12.8584 5.34166 12.8584 5.1464 12.6631L0.678505 8.1952C0.483242 7.99994 0.483242 7.68336 0.678505 7.4881L2.32921 5.83739C2.52467 5.64193 2.84166 5.64216 3.03684 5.83791L5.14622 7.95354C5.34147 8.14936 5.65859 8.14952 5.85403 7.95388L13.3797 0.420561C13.575 0.22513 13.8917 0.225051 14.087 0.420383L15.7381 2.07143C15.9333 2.26669 15.9333 2.58327 15.7381 2.77854L5.8535 12.6631Z" />
      </svg>
    </span>
    {text}
  </p>
);
