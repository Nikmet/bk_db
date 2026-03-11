import { CalculationParamsForm } from "@/components/features/calculation-params-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalculationParamsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Параметры расчёта</CardTitle>
        <CardDescription>
          Заполните операционные параметры. После сохранения будет сформирован демо-результат расчёта заказа.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CalculationParamsForm />
      </CardContent>
    </Card>
  );
}

