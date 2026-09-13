import React from 'react';
import ITRSHubLogo from './ITRSHubLogo';

interface RobinsonsIconProps {
  className?: string;
  customLogo?: string;
}

// Redirect old Robinsons icon to the new ITRS Hub Tech Logo
const RobinsonsIcon: React.FC<RobinsonsIconProps> = (props) => {
  return <ITRSHubLogo {...props} />;
};

export default RobinsonsIcon;
