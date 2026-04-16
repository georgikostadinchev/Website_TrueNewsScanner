import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-50 dark:bg-rose-950/30 rounded-full mb-2">
          <AlertCircle className="w-12 h-12 text-rose-500" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Страницата не е намерена</h1>
        <p className="text-lg font-medium text-muted-foreground">
          Изглежда адресът, който търсите, е невалиден или страницата е преместена.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button size="lg" className="font-bold rounded-xl px-8 gap-2">
              <ArrowLeft className="w-5 h-5" />
              Обратно към началото
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
