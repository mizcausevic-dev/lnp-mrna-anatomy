import React from "react";
import { Composition } from "remotion";
import { LnpDelivery } from "./LnpDelivery";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LnpDelivery"
      component={LnpDelivery}
      durationInFrames={1020}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
