import { iconSvg, type IconName } from '../lib/icons';

export default function Icon({ name }: { name: IconName }) {
  return <span className="icon-box" dangerouslySetInnerHTML={{ __html: iconSvg(name) }} />;
}
