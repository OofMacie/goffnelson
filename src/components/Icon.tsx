import { iconSvg, type IconName } from "../lib/icons";

export default function Icon({ name }: { name: IconName }) {
  return <span style={{ display: "inline-flex" }} dangerouslySetInnerHTML={{ __html: iconSvg(name) }} />;
}
