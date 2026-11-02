import tseslint from "typescript-eslint";

const features = ["day-board", "reservation-booking", "reservation-history"];

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...features.map((feature) => ({
    files: [`src/features/${feature}/**`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: features
            .filter((other) => other !== feature)
            .map((other) => ({
              group: [`**/${other}`, `**/${other}/**`],
              message: "Una feature no importa a otra: componé desde App.tsx.",
            })),
        },
      ],
    },
  })),
  {
    files: ["src/shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/features", "**/features/**", "**/App"],
              message: "shared no importa features.",
            },
          ],
        },
      ],
    },
  },
);
