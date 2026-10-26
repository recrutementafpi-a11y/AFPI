import { Composition } from "remotion";
import { AfpiIntro } from "./AfpiIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AfpiIntro"
      component={AfpiIntro}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
