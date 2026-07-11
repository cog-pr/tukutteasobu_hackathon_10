export type VoteChoice = "A" | "B";

export type VoteResult = {
  countA: number;
  countB: number;
  winner: VoteChoice | "draw";
};

export function countVotes(
  votes: Record<string, VoteChoice>,
): VoteResult {
  let countA = 0;
  let countB = 0;

  for (const choice of Object.values(votes)) {
    if (choice === "A") {
      countA++;
    } else if (choice === "B") {
      countB++;
    }
  }

  const winner: VoteChoice | "draw" =
    countA === countB ? "draw" : countA > countB ? "A" : "B";

  return { countA, countB, winner };
}
