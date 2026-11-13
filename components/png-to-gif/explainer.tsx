import Link from 'next/link'

export function PngToGifExplainer() {
  return (
    <div>
      <h2>What is PNG?</h2>
      <p>
        <strong>PNG (Portable Network Graphics)</strong> is a file type that
        is ideal for images with <strong>clean edges and true transparency</strong>.
        PNG was developed in the mid-1990s as an open solution for creating
        images instead of GIF, which was then covered by patents and not
        freely available. PNG uses <strong>lossless data compression</strong>.
        That means the amount of data you have saved is exactly the same
        amount of data you get back.
      </p>
      <p>
        That&rsquo;s why <strong>screenshots, logos, UI mockups</strong>, and
        anything with text or sharp lines tend to live as PNGs. The trade-off
        is that a PNG version of a photograph would be a much larger file
        than the same image saved as a <Link href="/png-to-jpg/">JPG</Link> or{' '}
        <Link href="/png-to-webp/">WebP</Link>. PNG files do not support
        animation natively, as they are meant to contain only one frame in a
        single file.
      </p>

      <h2>What is APNG?</h2>
      <p>
        An <strong>APNG (or Animated PNG)</strong> is PNG&rsquo;s answer to
        an animated GIF. This format lets a PNG file hold data like a GIF,
        such as <strong>multiple frames, timing data, and playback speed</strong>.
        It&rsquo;s basically a GIF file with a full color range and real
        alpha transparency instead of the blocky, 256-color range of a GIF
        file.
      </p>
      <p>
        But there&rsquo;s one big issue: <strong>browser support</strong>.
        Not all browsers support this format. Firefox supported it in 2007,
        but Chrome didn&rsquo;t until 2017, and Edge didn&rsquo;t announce
        support until 2019. Most modern browsers support it (around 97%),
        but there&rsquo;s still a big gap on other platforms: <strong>Slack,
        Discord, Twitter, Instagram, iMessage, and most email clients</strong>{' '}
        don&rsquo;t support APNG, and that&rsquo;s a huge reason people
        convert APNG to GIF.
      </p>

      <h2>What is GIF?</h2>
      <p>
        <strong>GIF (Graphics Interchange Format)</strong> was created by
        CompuServe in 1987 by a team including Steve Wilhite. At the time,
        CompuServe was one of the major online services, delivered over the
        then-slow speed of dial-up modems. Users connected to the online
        service from a variety of computers (PCs, Macs, Amigas, Ataris etc.)
        each with their own means of representing images on screen. GIF was
        devised as a <strong>small downloadable image file</strong> that
        could be easily displayed in full color on any online computer.
      </p>
      <p>
        Later, in 1987, they created the first animation. Although animation
        was only experimental for a few years, GIF in the end was the first
        and still the <strong>most widely supported way to put animation
        online</strong>. For almost 40 years now, all browsers, messaging
        programs, forums, CMS systems, and even email programs play GIFs
        without being asked.
      </p>
      <p>
        Technically, the format is showing its age. It maxes out at{' '}
        <strong>256 colors per frame</strong>. Transparency in GIFs is also{' '}
        <strong>binary</strong> (i.e., fully opaque or fully transparent
        &mdash; no partial transparency). As for compression, GIF uses a
        method that is less efficient than just about every other
        century&rsquo;s method. But a short play that works everywhere is
        the root of GIF&rsquo;s superpower. GIF&rsquo;s never-was-to-be-great
        quality is a given. But it plays. Everywhere. All the time.
      </p>

      <h2>Why convert PNG or APNG to GIF?</h2>
      <p>A few honest reasons:</p>
      <ul>
        <li>
          You&rsquo;re uploading the animation somewhere that{' '}
          <strong>only accepts GIF files</strong> for uploading animations
          (e.g., animation is to be used as Slack reactions, in old forums,
          in email signatures, within CMS image fields, etc.). The uploaded
          APNG files will not animate on the destination. This is because
          most social media sites, email clients, and CMSes treat APNG files
          as simple PNG files and <strong>display only the first frame</strong>,
          since it is also a valid still image.
        </li>
        <li>
          You need to provide a thumbnail for previewing that will{' '}
          <strong>automatically start playing and looping</strong>. GIFs
          generally work as expected in almost all situations (on all social
          networks, in all email clients, within all content management
          systems). Static PNGs don&rsquo;t work as they are meant to be
          viewed as still images. Most modern browsers support APNG, but
          most platforms strip the animation when you upload it.
        </li>
        <li>
          The recipient is on an <strong>unknown system</strong>, and you
          can&rsquo;t guarantee APNG playback. In doubt, choose GIF.
        </li>
      </ul>

      <h2>Why keep it as PNG or APNG?</h2>
      <p>Just as many honest reasons to not convert:</p>
      <ul>
        <li>
          <strong>Quality:</strong> As PNG is lossless (no quality loss
          during saving), all kinds of artwork (screenshots, logos, etc.)
          are saved 1:1 as they are. Saving the same image as a GIF reduces
          the supported colors down to 256. This is where{' '}
          <strong>banding, dithering, and lots of color errors</strong>{' '}
          occur. Soft shades and gradients are the first to suffer.
        </li>
        <li>
          <strong>File size of animated stuff:</strong> As already
          mentioned, GIF&rsquo;s compression is from 1987 and thus not
          exactly great. APNG almost always results in{' '}
          <strong>smaller file sizes than GIF</strong> for equivalent
          animations. Modern formats like WebP or{' '}
          <Link href="/png-to-avif/">AVIF</Link> even beat APNG in that
          regard and generally result in better quality as well. If your
          GIFs do get large, you can always run them through a{' '}
          <Link href="/compress-gif/">GIF compressor</Link>.
        </li>
        <li>
          <strong>Transparency:</strong> With PNG and APNG, you can use real
          transparency with <strong>soft and anti-aliased edges</strong>.
          GIF transparency, on the other hand, is just a simple on/off
          switch. If a pixel is semi-transparent, then it has to choose a
          color, which nearly always results in a visible fringe with hard
          edges.
        </li>
        <li>
          Even if you&rsquo;re going to make it animate, if the end result
          is going to be <strong>only one frame</strong>, then you should
          just save it as a PNG instead of converting it to GIF. It does
          nothing for you and results in a worse-quality image with worse
          colors and a larger file size. If what you actually want is a GIF
          from a clip, start from{' '}
          <Link href="/video-to-gif/">video-to-GIF</Link> instead.
        </li>
      </ul>
      <p>
        A quick rule of thumb: <strong>convert to GIF when the destination
        forces your hand</strong>. Keep it as PNG or APNG when quality or
        transparency matters more than universal playback.
      </p>
    </div>
  )
}
