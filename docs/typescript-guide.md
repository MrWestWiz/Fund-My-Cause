# TypeScript Guide

This document provides guidance on using TypeScript effectively in the Fund-My-Cause frontend.

## Type Organization

Types are organized into logical modules in `src/types/`:

- **campaign.ts** - Campaign domain types
- **contract.ts** - Smart contract interaction types
- **soroban.ts** - Soroban-specific types
- **comment.ts** - Comment types
- **milestone.ts** - Milestone types
- **api.ts** - API response types
- **components.ts** - Component prop types
- **utils.ts** - Utility and hook types
- **index.ts** - Central export point

## Strict Type Checking

The project uses strict TypeScript configuration:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

This means:
- No implicit `any` types
- Null/undefined must be explicitly handled
- All code paths must return a value
- Unused variables cause errors

## Common Patterns

### API Response Types

```tsx
import type { CampaignResponse, ApiResponse } from "@/types";

async function fetchCampaign(id: string): Promise<ApiResponse<CampaignResponse>> {
  const response = await fetch(`/api/campaigns/${id}`);
  return response.json();
}
```

### Component Props

```tsx
import type { ButtonProps } from "@/types";

export function MyButton({ variant = "primary", ...props }: ButtonProps) {
  return <button className={`btn-${variant}`} {...props} />;
}
```

### Hook Return Types

```tsx
import type { UseCampaignReturn } from "@/types";

export function useCampaign(id: string): UseCampaignReturn {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  return { campaign, isLoading, error, refetch: async () => {} };
}
```

### Context Types

```tsx
import type { WalletContextType } from "@/types";

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
```

## Avoiding `any`

Never use `any` type. Instead:

```tsx
// ❌ Bad
function handleData(data: any) {
  return data.value;
}

// ✅ Good
interface DataType {
  value: string;
}

function handleData(data: DataType): string {
  return data.value;
}
```

## Null/Undefined Handling

Always handle null/undefined explicitly:

```tsx
// ❌ Bad
function getName(user: User) {
  return user.name.toUpperCase();
}

// ✅ Good
function getName(user: User | null): string {
  return user?.name?.toUpperCase() ?? "Unknown";
}
```

## Generic Types

Use generics for reusable types:

```tsx
// ✅ Good
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type CampaignResponse = ApiResponse<Campaign>;
type UserResponse = ApiResponse<User>;
```

## Union Types

Use union types for multiple possibilities:

```tsx
// ✅ Good
type CampaignStatus = "Active" | "Successful" | "Refunded" | "Cancelled";

function getStatusColor(status: CampaignStatus): string {
  switch (status) {
    case "Active":
      return "blue";
    case "Successful":
      return "green";
    case "Refunded":
      return "orange";
    case "Cancelled":
      return "red";
  }
}
```

## Type Guards

Use type guards for runtime type checking:

```tsx
// ✅ Good
function isCampaign(obj: unknown): obj is Campaign {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "title" in obj &&
    "goal" in obj
  );
}

function processCampaign(data: unknown) {
  if (isCampaign(data)) {
    console.log(data.title);
  }
}
```

## Readonly Types

Use `readonly` for immutable data:

```tsx
// ✅ Good
interface Campaign {
  readonly id: string;
  readonly title: string;
  readonly goal: number;
}

// This will cause a type error
const campaign: Campaign = { id: "1", title: "Test", goal: 1000 };
campaign.title = "New Title"; // ❌ Error
```

## Utility Types

Use TypeScript utility types:

```tsx
// Partial - all properties optional
type PartialCampaign = Partial<Campaign>;

// Required - all properties required
type RequiredCampaign = Required<Campaign>;

// Pick - select specific properties
type CampaignPreview = Pick<Campaign, "id" | "title" | "goal">;

// Omit - exclude specific properties
type CampaignWithoutId = Omit<Campaign, "id">;

// Record - object with specific keys
type CampaignsByStatus = Record<CampaignStatus, Campaign[]>;
```

## JSDoc Comments

Add JSDoc comments for complex types:

```tsx
/**
 * Campaign data model
 * @property id - Unique campaign identifier
 * @property title - Campaign title
 * @property goal - Funding goal in XLM
 * @property deadline - Campaign deadline timestamp
 */
interface Campaign {
  id: string;
  title: string;
  goal: number;
  deadline: string;
}

/**
 * Fetch campaign by ID
 * @param id - Campaign ID
 * @returns Campaign data or null if not found
 * @throws Error if fetch fails
 */
async function fetchCampaign(id: string): Promise<Campaign | null> {
  // implementation
}
```

## Best Practices

1. **Always type function parameters and return values**
2. **Use specific types instead of `any`**
3. **Handle null/undefined explicitly**
4. **Use union types for multiple possibilities**
5. **Create reusable types in the types directory**
6. **Use type guards for runtime validation**
7. **Add JSDoc comments for public APIs**
8. **Use `readonly` for immutable data**
9. **Leverage utility types for common patterns**
10. **Keep types close to where they're used**

## Troubleshooting

### "Object is possibly null"

```tsx
// ❌ Error
const value = obj.property.nested;

// ✅ Solution
const value = obj?.property?.nested ?? defaultValue;
```

### "Type 'X' is not assignable to type 'Y'"

```tsx
// ❌ Error
const campaign: Campaign = { id: "1" }; // Missing required properties

// ✅ Solution
const campaign: Campaign = {
  id: "1",
  title: "Test",
  goal: 1000,
  deadline: "2024-12-31",
};
```

### "Parameter 'X' implicitly has an 'any' type"

```tsx
// ❌ Error
function handleClick(event) {
  console.log(event.target);
}

// ✅ Solution
function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
  console.log(event.currentTarget);
}
```
