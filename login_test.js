import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // subida gradual
    { duration: "1m", target: 10 },  // carga estable
    { duration: "30s", target: 0 },  // bajada
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],     // < 1% errores
    http_req_duration: ["p(95)<500"],   // p95 < 500 ms
  },
};

export default function () {
  const payload = JSON.stringify({
    boleta: "2022630604",
    password: "pM2022630604",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(
    "http://localhost:3000/users/loginUser",
    payload,
    params
  );

  check(res, {
    "status 200": (r) => r.status === 200,
    "login exitoso": (r) => r.json("error") === 0,
    "token generado": (r) => r.json("token") !== undefined,
  });

  sleep(1);
}