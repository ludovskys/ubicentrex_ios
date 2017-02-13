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

#import "UIDevice+Resolutions.h"

@implementation UIDevice (Resolutions)

- (UIDeviceResolution)resolution
{
	UIDeviceResolution resolution = UIDeviceResolution_Unknown;
	
	UIScreen *mainScreen = [UIScreen mainScreen];
	
	CGFloat scale = ([mainScreen respondsToSelector:@selector(scale)] ? mainScreen.scale : 1.0f);
	CGFloat pixelHeight = (CGRectGetHeight(mainScreen.bounds) * scale);
	
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone)
	{
		if (scale == 3.0f)
		{
			if (pixelHeight == 2208.0f)
			{
				resolution = UIDeviceResolution_iPhone6Plus;
			}
		}
		else if (scale == 2.0f)
		{
			if (pixelHeight == 960.0f)
			{
				resolution = UIDeviceResolution_iPhoneRetina35;
			}
			else if (pixelHeight == 1136.0f)
			{
				resolution = UIDeviceResolution_iPhone5;
			}
			else if (pixelHeight == 1334.0f)
			{
				resolution = UIDeviceResolution_iPhone6;
			}
		}
		else if (scale == 1.0f && pixelHeight == 480.0f)
		{
			resolution = UIDeviceResolution_iPhoneStandard;
		}
	}
	else if(UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone)
	{
		if (scale == 2.0f && pixelHeight == 2048.0f)
		{
			resolution = UIDeviceResolution_iPadRetina;
			
		}
		else if (scale == 1.0f && pixelHeight == 1024.0f)
		{
			resolution = UIDeviceResolution_iPadStandard;
		}
	}
	
	return resolution;
}

@end
