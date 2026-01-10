import { TEST_1_PUBLIC } from "@/tests/test-1.public";
import { TestClient } from "@/components/TestClient";

export default function TestPage() {
  return <TestClient test={TEST_1_PUBLIC} />;
}
