type Props = { kind: "calendar-corner" | "slender" | "sweeping" | "branch" | "spray" | "mini" | "corner-left" | "corner-right" | `atelier-${"01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10"}`; className: string };
export function Watercolor({ kind, className }: Props) {
  return <img className={"watercolor " + className} src={"/images/watercolor-" + kind + ".webp"} alt="" aria-hidden="true" />;
}
