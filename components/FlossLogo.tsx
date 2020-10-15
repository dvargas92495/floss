import { Logo } from "@dvargas92495/ui";
import React from "react";

const FlossLogo = ({ size }: {size: number}) => (
  <Logo size={size} viewBoxWidth={900}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M625 300C625 244.772 669.772 200 725 200V250C697.386 250 675 272.386 675 300C675 355.228 630.228 400 575 400V350C602.614 350 625 327.614 625 300Z"
      fill="#F7941D"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M800 300C800 244.772 844.772 200 900 200V250C872.386 250 850 272.386 850 300C850 355.228 805.228 400 750 400V350C777.614 350 800 327.614 800 300Z"
      fill="#333333"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M250 100C250 44.7715 205.228 0 150 0C94.7715 0 50 44.7715 50 100V150H0V200H50V400H100V200H150V150H100V100C100 72.3858 122.386 50 150 50C177.614 50 200 72.3858 200 100H250Z"
      fill="#F7941D"
    />
    <rect x="275" width="50" height="400" fill="#333333" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M450 400C505.228 400 550 355.228 550 300C550 244.772 505.228 200 450 200C394.772 200 350 244.772 350 300C350 355.228 394.772 400 450 400ZM450 350C477.614 350 500 327.614 500 300C500 272.386 477.614 250 450 250C422.386 250 400 272.386 400 300C400 327.614 422.386 350 450 350Z"
      fill="#3BA4DC"
    />
  </Logo>
);

export default FlossLogo;
