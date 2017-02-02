/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import <Foundation/Foundation.h>
#import "CDVAvailabilityDeprecated.h"

enum {
	
	UIDeviceResolution_Unknown           = 0,
	UIDeviceResolution_iPhoneStandard    = 1,    // iPhone 1,3,3GS Standard Display  (320x480px)
	UIDeviceResolution_iPhoneRetina35    = 2,    // iPhone 4,4S Retina Display 3.5"  (640x960px)
	UIDeviceResolution_iPhone5			 = 3,    // iPhone 5 Retina Display 4"       (640x1136px)
	UIDeviceResolution_iPhone6			 = 4,    // 750 × 1334 pixels
	UIDeviceResolution_iPhone6Plus		 = 5,	 // 1242 × 2208 pixels
	UIDeviceResolution_iPadStandard      = 6,    // iPad 1,2,mini Standard Display   (1024x768px)
	UIDeviceResolution_iPadRetina        = 7     // iPad 3 Retina Display            (2048x1536px)
	
};

typedef NSUInteger UIDeviceResolution;

@interface UIDevice (org_apache_cordova_UIDevice_Resolution)

- (UIDeviceResolution)resolution;

NSString *NSStringFromResolution(UIDeviceResolution resolution);

@end
